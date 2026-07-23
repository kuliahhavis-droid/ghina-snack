import { supabase } from './supabase';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = {
  method?: string;
  body?: any;
  headers?: any;
};

const getCurrentUserId = () => {
  const raw = localStorage.getItem('ghina-snack-user');
  if (!raw) return 'system';
  try {
    const user = JSON.parse(raw);
    return user.id || 'system';
  } catch {
    return 'system';
  }
};

export const setAuthStorage = (token: string, user: unknown) => {
  localStorage.setItem('ghina-snack-token', token);
  localStorage.setItem('ghina-snack-user', JSON.stringify(user));
};

export const clearAuthStorage = () => {
  localStorage.removeItem('ghina-snack-token');
  localStorage.removeItem('ghina-snack-user');
};

export const getStoredUser = <T,>() => {
  const raw = localStorage.getItem('ghina-snack-user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  // Artificial delay to make loading transitions smoother and let skeletons show
  await new Promise((resolve) => setTimeout(resolve, 300));

  const userId = getCurrentUserId();
  const method = options.method || 'GET';
  const urlParts = path.split('?');
  const cleanPath = urlParts[0];
  const queryParams = new URLSearchParams(urlParts[1] || '');

  let result: any = null;

  try {
    // ----------------------------------------------------
    // INCOMES
    // ----------------------------------------------------
    if (cleanPath === '/incomes') {
      if (method === 'GET') {
        const { data, error } = await supabase
          .from('income')
          .select('*, category:categories(*), product:products(*), customer:customers(*)')
          .order('transactionDate', { ascending: false });
        if (error) throw error;
        result = data;
      } 
      else if (method === 'POST') {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        
        let hppCost = 0;
        let netProfit = Number(body.amount);
        
        if (body.productId && body.quantity) {
          const { data: prod } = await supabase.from('products').select('hpp').eq('id', body.productId).single();
          if (prod) {
            hppCost = Number(prod.hpp) * body.quantity;
            netProfit = Number(body.amount) - hppCost;
            
            // Decrement product stock
            const { data: currentProduct } = await supabase.from('products').select('stock').eq('id', body.productId).single();
            if (currentProduct) {
              await supabase.from('products').update({ stock: Math.max(0, currentProduct.stock - body.quantity) }).eq('id', body.productId);
            }
          }
        }

        const { data: income, error } = await supabase
          .from('income')
          .insert({
            userId,
            categoryId: body.categoryId || null,
            productId: body.productId || null,
            quantity: body.quantity || null,
            amount: body.amount,
            transactionDate: body.transactionDate,
            source: body.source,
            description: body.description || null,
            proofUrl: body.proofUrl || null,
            hppCost,
            netProfit
          })
          .select()
          .single();
        if (error) throw error;

        // Create receivable if unpaid
        if (body.paymentStatus === 'UNPAID' && body.customerId) {
          await supabase.from('receivables').insert({
            customerId: body.customerId,
            incomeId: income.id,
            amount: body.amount,
            paidAmount: 0,
            status: 'UNPAID',
            dueDate: body.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          });
        }

        // Add audit log
        await supabase.from('audit_logs').insert({
          userId,
          action: 'CREATE',
          entity: 'Income',
          entityId: income.id,
          details: `Mencatat pemasukan: "${body.source}" sebesar Rp ${body.amount}`
        });

        result = income;
      }
    } 
    else if (cleanPath.startsWith('/incomes/')) {
      const incomeId = cleanPath.split('/')[2];
      if (method === 'DELETE') {
        const { data: current, error: getErr } = await supabase.from('income').select('*').eq('id', incomeId).maybeSingle();
        if (getErr) throw getErr;

        // Revert product stock
        if (current && current.productId && current.quantity) {
          const { data: prod } = await supabase.from('products').select('stock').eq('id', current.productId).maybeSingle();
          if (prod) {
            await supabase.from('products').update({ stock: prod.stock + current.quantity }).eq('id', current.productId);
          }
        }

        // Delete receivables
        await supabase.from('receivables').delete().eq('incomeId', incomeId);

        // Delete income
        const { error } = await supabase.from('income').delete().eq('id', incomeId);
        if (error) throw error;

        // Audit Log
        await supabase.from('audit_logs').insert({
          userId,
          action: 'DELETE',
          entity: 'Income',
          entityId: incomeId,
          details: `Menghapus pemasukan: "${current.source}" sebesar Rp ${current.amount}`
        });
        result = current;
      }
    }

    // ----------------------------------------------------
    // EXPENSES
    // ----------------------------------------------------
    else if (cleanPath === '/expenses') {
      if (method === 'GET') {
        const { data, error } = await supabase
          .from('expense')
          .select('*, category:categories(*), product:products(*), supplier:suppliers(*)')
          .order('transactionDate', { ascending: false });
        if (error) throw error;
        result = data;
      } 
      else if (method === 'POST') {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        const { data: expense, error } = await supabase
          .from('expense')
          .insert({
            userId,
            categoryId: body.categoryId,
            productId: body.productId || null,
            supplierId: body.supplierId || null,
            title: body.title,
            note: body.note || null,
            amount: body.amount,
            transactionDate: body.transactionDate,
            proofUrl: body.proofUrl || null
          })
          .select()
          .single();
        if (error) throw error;

        // Audit Log
        await supabase.from('audit_logs').insert({
          userId,
          action: 'CREATE',
          entity: 'Expense',
          entityId: expense.id,
          details: `Mencatat pengeluaran: "${body.title}" sebesar Rp ${body.amount}`
        });
        result = expense;
      }
    }
    else if (cleanPath.startsWith('/expenses/')) {
      const expenseId = cleanPath.split('/')[2];
      if (method === 'DELETE') {
        const { data: current } = await supabase.from('expense').select('*').eq('id', expenseId).maybeSingle();
        const { error } = await supabase.from('expense').delete().eq('id', expenseId);
        if (error) throw error;

        // Audit Log
        if (current) {
          await supabase.from('audit_logs').insert({
            userId,
            action: 'DELETE',
            entity: 'Expense',
            entityId: expenseId,
            details: `Menghapus pengeluaran: "${current.title}" sebesar Rp ${current.amount}`
          });
        }
        result = current;
      }
    }

    // ----------------------------------------------------
    // PRODUCTS
    // ----------------------------------------------------
    else if (cleanPath === '/products') {
      if (method === 'GET') {
        const { data, error } = await supabase.from('products').select('*').order('name');
        if (error) throw error;
        result = data;
      } 
      else if (method === 'POST') {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        const { data: product, error } = await supabase.from('products').insert(body).select().single();
        if (error) throw error;

        await supabase.from('audit_logs').insert({
          userId,
          action: 'CREATE',
          entity: 'Product',
          entityId: product.id,
          details: `Menambahkan produk baru: "${body.name}"`
        });
        result = product;
      }
    }
    else if (cleanPath.startsWith('/products/')) {
      const prodId = cleanPath.split('/')[2];
      if (method === 'PUT') {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        const { data: product, error } = await supabase.from('products').update(body).eq('id', prodId).select().maybeSingle();
        if (error) throw error;
        if (!product) throw new Error(`Produk dengan ID ${prodId} tidak ditemukan di Supabase atau diblokir oleh RLS policy.`);

        await supabase.from('audit_logs').insert({
          userId,
          action: 'UPDATE',
          entity: 'Product',
          entityId: prodId,
          details: `Mengubah data produk: "${body.name}"`
        });
        result = product;
      } 
      else if (method === 'DELETE') {
        const { data: current } = await supabase.from('products').select('*').eq('id', prodId).maybeSingle();
        const { error } = await supabase.from('products').delete().eq('id', prodId);
        if (error) throw error;

        if (current) {
          await supabase.from('audit_logs').insert({
            userId,
            action: 'DELETE',
            entity: 'Product',
            entityId: prodId,
            details: `Menghapus produk: "${current.name}"`
          });
        }
        result = current;
      }
    }

    // ----------------------------------------------------
    // SUPPLIERS
    // ----------------------------------------------------
    else if (cleanPath === '/suppliers') {
      if (method === 'GET') {
        const { data, error } = await supabase.from('suppliers').select('*').order('name');
        if (error) throw error;
        result = data;
      } 
      else if (method === 'POST') {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        const { data: supplier, error } = await supabase.from('suppliers').insert(body).select().single();
        if (error) throw error;

        await supabase.from('audit_logs').insert({
          userId,
          action: 'CREATE',
          entity: 'Supplier',
          entityId: supplier.id,
          details: `Menambahkan supplier baru: "${body.name}"`
        });
        result = supplier;
      }
    }
    else if (cleanPath.startsWith('/suppliers/')) {
      const suppId = cleanPath.split('/')[2];
      if (method === 'PUT') {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        const { data: supplier, error } = await supabase.from('suppliers').update(body).eq('id', suppId).select().maybeSingle();
        if (error) throw error;
        if (!supplier) throw new Error(`Supplier dengan ID ${suppId} tidak ditemukan di Supabase atau diblokir oleh RLS policy.`);

        await supabase.from('audit_logs').insert({
          userId,
          action: 'UPDATE',
          entity: 'Supplier',
          entityId: suppId,
          details: `Mengubah data supplier: "${body.name}"`
        });
        result = supplier;
      } 
      else if (method === 'DELETE') {
        const { data: current } = await supabase.from('suppliers').select('*').eq('id', suppId).maybeSingle();
        const { error } = await supabase.from('suppliers').delete().eq('id', suppId);
        if (error) throw error;

        if (current) {
          await supabase.from('audit_logs').insert({
            userId,
            action: 'DELETE',
            entity: 'Supplier',
            entityId: suppId,
            details: `Menghapus supplier: "${current.name}"`
          });
        }
        result = current;
      }
    }

    // ----------------------------------------------------
    // CUSTOMERS
    // ----------------------------------------------------
    else if (cleanPath === '/customers') {
      if (method === 'GET') {
        const { data, error } = await supabase.from('customers').select('*, receivables(*)').order('name');
        if (error) throw error;
        result = data;
      } 
      else if (method === 'POST') {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        const { data: customer, error } = await supabase.from('customers').insert(body).select().single();
        if (error) throw error;

        await supabase.from('audit_logs').insert({
          userId,
          action: 'CREATE',
          entity: 'Customer',
          entityId: customer.id,
          details: `Menambahkan pelanggan baru: "${body.name}"`
        });
        result = customer;
      }
    }
    else if (cleanPath.startsWith('/customers/')) {
      const custId = cleanPath.split('/')[2];
      if (method === 'PUT') {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        const { data: customer, error } = await supabase.from('customers').update(body).eq('id', custId).select().maybeSingle();
        if (error) throw error;
        if (!customer) throw new Error(`Pelanggan/Reseller dengan ID ${custId} tidak ditemukan di Supabase atau diblokir oleh RLS policy.`);

        await supabase.from('audit_logs').insert({
          userId,
          action: 'UPDATE',
          entity: 'Customer',
          entityId: custId,
          details: `Mengubah data pelanggan: "${body.name}"`
        });
        result = customer;
      } 
      else if (method === 'DELETE') {
        const { data: current } = await supabase.from('customers').select('*').eq('id', custId).maybeSingle();
        const { error } = await supabase.from('customers').delete().eq('id', custId);
        if (error) throw error;

        if (current) {
          await supabase.from('audit_logs').insert({
            userId,
            action: 'DELETE',
            entity: 'Customer',
            entityId: custId,
            details: `Menghapus pelanggan: "${current.name}"`
          });
        }
        result = current;
      }
    }

    // ----------------------------------------------------
    // RECEIVABLES
    // ----------------------------------------------------
    else if (cleanPath === '/receivables') {
      if (method === 'GET') {
        const { data, error } = await supabase.from('receivables').select('*, customer:customers(*), income:income(*)').order('createdAt', { ascending: false });
        if (error) throw error;
        result = data;
      }
    }
    else if (cleanPath.startsWith('/receivables/') && cleanPath.endsWith('/payments')) {
      const rxId = cleanPath.split('/')[2];
      if (method === 'POST') {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        
        // Fetch current receivable
        const { data: rx, error: getErr } = await supabase.from('receivables').select('*, customer:customers(*)').eq('id', rxId).single();
        if (getErr) throw getErr;

        const newPaidAmount = Number(rx.paidAmount) + Number(body.amount);
        const totalAmount = Number(rx.amount);
        const status = newPaidAmount >= totalAmount ? 'PAID' : 'PARTIAL';

        // Update receivable
        const { data: updatedRx, error: updateErr } = await supabase
          .from('receivables')
          .update({
            paidAmount: newPaidAmount,
            status,
            notes: body.notes || rx.notes
          })
          .eq('id', rxId)
          .select()
          .single();
        if (updateErr) throw updateErr;

        // Fetch income category for "Penjualan"
        const { data: cat } = await supabase.from('categories').select('id').eq('type', 'INCOME').limit(1).single();

        // Create income transaction representing payment
        await supabase.from('income').insert({
          userId,
          customerId: rx.customerId,
          categoryId: cat?.id || null,
          source: `Pelunasan Piutang: ${rx.customer.name}`,
          description: `Pembayaran piutang. Catatan: ${body.notes || '-'}`,
          amount: body.amount,
          transactionDate: new Date().toISOString()
        });

        // Audit Log
        await supabase.from('audit_logs').insert({
          userId,
          action: 'UPDATE',
          entity: 'Receivable',
          entityId: rxId,
          details: `Mencatat pembayaran piutang "${rx.customer.name}" sebesar Rp ${body.amount} (Status: ${status})`
        });

        result = updatedRx;
      }
    }

    // ----------------------------------------------------
    // CATEGORIES
    // ----------------------------------------------------
    else if (cleanPath === '/categories') {
      if (method === 'GET') {
        const { data, error } = await supabase.from('categories').select('*').order('name');
        if (error) throw error;
        result = data;
      }
    }

    // ----------------------------------------------------
    // AUDIT LOGS
    // ----------------------------------------------------
    else if (cleanPath === '/audit-logs') {
      if (method === 'GET') {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*, user:users(id, name, email, role)')
          .order('createdAt', { ascending: false });
        if (error) throw error;
        result = data;
      }
    }

    // ----------------------------------------------------
    // REPORTS (Monthly Report)
    // ----------------------------------------------------
    else if (cleanPath === '/reports/monthly') {
      const monthParam = queryParams.get('month') || new Date().toISOString().slice(0, 7);
      const start = `${monthParam}-01T00:00:00.000Z`;
      const endYear = Number(monthParam.slice(0, 4)) + (monthParam.slice(5, 7) === '12' ? 1 : 0);
      const endMonth = monthParam.slice(5, 7) === '12' ? '01' : String(Number(monthParam.slice(5, 7)) + 1).padStart(2, '0');
      const end = `${endYear}-${endMonth}-01T00:00:00.000Z`;

      const { data: incomes } = await supabase.from('income').select('amount, transactionDate').gte('transactionDate', start).lt('transactionDate', end);
      const { data: expenses } = await supabase.from('expense').select('amount, transactionDate').gte('transactionDate', start).lt('transactionDate', end);

      const totalIncome = (incomes || []).reduce((sum, inc) => sum + Number(inc.amount), 0);
      const totalExpense = (expenses || []).reduce((sum, exp) => sum + Number(exp.amount), 0);

      // Group daily
      const dailyMap = new Map<string, { date: string; income: number; expense: number; net: number }>();
      
      const numDays = new Date(Number(monthParam.slice(0, 4)), Number(monthParam.slice(5, 7)), 0).getDate();
      for (let i = 1; i <= numDays; i++) {
        const dayStr = `${monthParam}-${String(i).padStart(2, '0')}`;
        dailyMap.set(dayStr, { date: dayStr, income: 0, expense: 0, net: 0 });
      }

      for (const inc of incomes || []) {
        const dateStr = inc.transactionDate.slice(0, 10);
        const current = dailyMap.get(dateStr) || { date: dateStr, income: 0, expense: 0, net: 0 };
        current.income += Number(inc.amount);
        current.net += Number(inc.amount);
        dailyMap.set(dateStr, current);
      }

      for (const exp of expenses || []) {
        const dateStr = exp.transactionDate.slice(0, 10);
        const current = dailyMap.get(dateStr) || { date: dateStr, income: 0, expense: 0, net: 0 };
        current.expense += Number(exp.amount);
        current.net -= Number(exp.amount);
        dailyMap.set(dateStr, current);
      }

      result = {
        period: { start, end },
        summary: {
          income: totalIncome,
          expense: totalExpense,
          net: totalIncome - totalExpense
        },
        daily: Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))
      };
    }

    // ----------------------------------------------------
    // DASHBOARD STATS
    // ----------------------------------------------------
    else if (cleanPath === '/dashboard/stats') {
      const monthParam = queryParams.get('month') || new Date().toISOString().slice(0, 7);
      const start = `${monthParam}-01T00:00:00.000Z`;
      const endYear = Number(monthParam.slice(0, 4)) + (monthParam.slice(5, 7) === '12' ? 1 : 0);
      const endMonth = monthParam.slice(5, 7) === '12' ? '01' : String(Number(monthParam.slice(5, 7)) + 1).padStart(2, '0');
      const end = `${endYear}-${endMonth}-01T00:00:00.000Z`;

      const { data: incomes } = await supabase.from('income').select('*, category:categories(*)').gte('transactionDate', start).lt('transactionDate', end);
      const { data: expenses } = await supabase.from('expense').select('*, category:categories(*)').gte('transactionDate', start).lt('transactionDate', end);
      
      const { data: recentIncomes } = await supabase.from('income').select('*, category:categories(*)').order('transactionDate', { ascending: false }).limit(5);
      const { data: recentExpenses } = await supabase.from('expense').select('*, category:categories(*)').order('transactionDate', { ascending: false }).limit(5);

      const totalIncome = (incomes || []).reduce((sum, inc) => sum + Number(inc.amount), 0);
      const totalExpense = (expenses || []).reduce((sum, exp) => sum + Number(exp.amount), 0);

      // Group expenses by category
      const catMap = new Map<string, { categoryId: string; categoryName: string; total: number }>();
      for (const exp of expenses || []) {
        const catId = exp.categoryId;
        const catName = exp.category?.name || 'Lainnya';
        const current = catMap.get(catId) || { categoryId: catId, categoryName: catName, total: 0 };
        current.total += Number(exp.amount);
        catMap.set(catId, current);
      }

      result = {
        period: { start, end },
        totals: {
          income: totalIncome,
          expense: totalExpense,
          net: totalIncome - totalExpense
        },
        counts: {
          income: (incomes || []).length,
          expense: (expenses || []).length
        },
        expenseByCategory: Array.from(catMap.values()),
        recentTransactions: {
          incomes: recentIncomes || [],
          expenses: recentExpenses || []
        }
      };
    }

    // ----------------------------------------------------
    // DASHBOARD ADVANCED (ANALYTICS)
    // ----------------------------------------------------
    else if (cleanPath === '/dashboard/advanced-stats') {
      const now = new Date();
      const monthlyProfitTrend = [];

      // Calculate last 6 months
      for (let i = 5; i >= 0; i--) {
        const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1).toISOString();
        const end = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 1).toISOString();

        const { data: incomes } = await supabase.from('income').select('amount, netProfit').gte('transactionDate', start).lt('transactionDate', end);
        const { data: expenses } = await supabase.from('expense').select('amount').gte('transactionDate', start).lt('transactionDate', end);

        const gross = (incomes || []).reduce((sum, inc) => sum + Number(inc.amount), 0);
        const expSum = (expenses || []).reduce((sum, exp) => sum + Number(exp.amount), 0);
        const net = (incomes || []).reduce((sum, inc) => sum + Number(inc.netProfit !== null && inc.netProfit !== undefined ? inc.netProfit : inc.amount), 0) - expSum;

        const monthLabel = targetMonth.toLocaleString('id-ID', { month: 'short', year: '2-digit' });

        monthlyProfitTrend.push({
          month: monthLabel,
          gross,
          expense: expSum,
          net
        });
      }

      // Pareto Analysis
      const { data: allExpenses } = await supabase.from('expense').select('amount, category:categories(name)');
      const catExpenseMap = new Map<string, number>();
      let totalExpenseSum = 0;

      for (const exp of allExpenses || []) {
        const amt = Number(exp.amount);
        totalExpenseSum += amt;
        const catName = exp.category?.name || 'Lainnya';
        catExpenseMap.set(catName, (catExpenseMap.get(catName) || 0) + amt);
      }

      const sortedCategories = Array.from(catExpenseMap.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount);

      let cumulativeSum = 0;
      const paretoData = sortedCategories.map((item) => {
        cumulativeSum += item.amount;
        const percentage = totalExpenseSum > 0 ? (item.amount / totalExpenseSum) * 100 : 0;
        const cumulativePercentage = totalExpenseSum > 0 ? (cumulativeSum / totalExpenseSum) * 100 : 0;
        return {
          ...item,
          percentage: Number(percentage.toFixed(1)),
          cumulativePercentage: Number(cumulativePercentage.toFixed(1))
        };
      });

      // Simple Forecasting
      let forecastIncome = 0;
      let forecastExpense = 0;
      const last3Months = monthlyProfitTrend.slice(-3);
      if (last3Months.length > 0) {
        const sumIncome = last3Months.reduce((sum, m) => sum + m.gross, 0);
        const sumExpense = last3Months.reduce((sum, m) => sum + m.expense, 0);
        forecastIncome = sumIncome / last3Months.length;
        forecastExpense = sumExpense / last3Months.length;
      }

      const forecast = {
        projectedIncome: Number(forecastIncome.toFixed(2)),
        projectedExpense: Number(forecastExpense.toFixed(2)),
        projectedNet: Number((forecastIncome - forecastExpense).toFixed(2))
      };

      result = {
        monthlyProfitTrend,
        paretoAnalysis: paretoData,
        forecasting: forecast
      };
    }
    
    else {
      throw new Error(`Endpoint mock not found: ${cleanPath}`);
    }

  } catch (error: any) {
    console.error(`ApiRequest fail on path ${path}:`, error);
    throw new ApiError(error.message || 'Request failed', 500, error);
  }

  // Return wrapped in the JSON response envelope expected by the frontend
  return {
    success: true,
    message: 'Operation successful',
    data: result
  } as unknown as T;
}
