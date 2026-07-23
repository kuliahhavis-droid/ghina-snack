import { PrismaClient, UserRole, CategoryType } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import fs from 'fs';
const envContent = fs.readFileSync('.env', 'utf-8');
const dbUrlMatch = envContent.match(/DATABASE_URL="?([^"\n\r]+)"?/);
const connectionString = dbUrlMatch ? dbUrlMatch[1] : process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = 'seeded-account-no-local-auth-needed';

  // 1. Clear Existing Data (except Users)
  console.log('Clearing existing transactions and master data to prevent duplicates...');
  await prisma.auditLog.deleteMany();
  await prisma.receivable.deleteMany();
  await prisma.income.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.customer.deleteMany();

  // 2. Seed Admin
  console.log('Seeding user admin...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ghinasnack.local' },
    update: {
      name: 'Admin Ghina Snack',
      role: UserRole.ADMIN,
      passwordHash,
    },
    create: {
      name: 'Admin Ghina Snack',
      email: 'admin@ghinasnack.local',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  // 3. Seed Categories
  console.log('Seeding categories...');
  const categoriesData = [
    { name: 'Buah', slug: 'buah', description: 'Pembelian bahan baku buah', type: CategoryType.EXPENSE },
    { name: 'Minyak', slug: 'minyak', description: 'Minyak goreng dan kebutuhan masak', type: CategoryType.EXPENSE },
    { name: 'Packaging', slug: 'packaging', description: 'Kemasan produk', type: CategoryType.EXPENSE },
    { name: 'Gas', slug: 'gas', description: 'Gas produksi', type: CategoryType.EXPENSE },
    { name: 'Gaji', slug: 'gaji', description: 'Gaji karyawan', type: CategoryType.EXPENSE },
    { name: 'Ongkir', slug: 'ongkir', description: 'Biaya pengiriman', type: CategoryType.EXPENSE },
    { name: 'Listrik', slug: 'listrik', description: 'Biaya listrik operasional', type: CategoryType.EXPENSE },
    { name: 'Penjualan Retail', slug: 'penjualan-retail', description: 'Pemasukan penjualan eceran', type: CategoryType.INCOME },
    { name: 'Penjualan Reseller', slug: 'penjualan-reseller', description: 'Pemasukan penjualan grosir reseller', type: CategoryType.INCOME },
    { name: 'Konsinyasi', slug: 'konsinyasi', description: 'Pemasukan dari titip jual toko mitra', type: CategoryType.INCOME },
  ];

  const categoriesMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        type: cat.type,
        isActive: true,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        type: cat.type,
        isActive: true,
      },
    });
    categoriesMap[cat.slug] = created.id;
  }

  // 4. Seed Suppliers
  console.log('Seeding suppliers...');
  const suppliersData = [
    { name: 'Toko Tani Makmur', contact: 'Bpk. Joko', phone: '08123456789', address: 'Pasar Induk Buah Kav. 12' },
    { name: 'PT Surya Plastindo', contact: 'Ibu Rina', phone: '08234567890', address: 'Kawasan Industri Candi Blok B/5' },
    { name: 'Agen Gas Pertamina Mandiri', contact: 'Mas Budi', phone: '08345678901', address: 'Jl. Raya Snack No. 45' },
  ];

  const suppliers: any[] = [];
  for (const s of suppliersData) {
    const created = await prisma.supplier.create({ data: s });
    suppliers.push(created);
  }

  // 5. Seed Products
  console.log('Seeding products...');
  const productsData = [
    { name: 'Keripik Pisang Coklat Premium', sku: 'KPC-001', stock: 120, hpp: 7500, price: 12500 },
    { name: 'Keripik Singkong Pedas Gila', sku: 'KSP-002', stock: 180, hpp: 4500, price: 8000 },
    { name: 'Makaroni Keju Asin', sku: 'MKA-003', stock: 90, hpp: 3800, price: 6500 },
  ];

  const products: any[] = [];
  for (const p of productsData) {
    const created = await prisma.product.create({ data: p });
    products.push(created);
  }

  // 6. Seed Customers / Resellers
  console.log('Seeding customers...');
  const customersData = [
    { name: 'Agen Snack Jakarta', phone: '085678901234', address: 'Ruko Kelapa Gading No. A-12, Jakarta Utara' },
    { name: 'Toko Oleh-Oleh Bandung', phone: '087890123456', address: 'Jl. Dago No. 104, Bandung' },
  ];

  const customers: any[] = [];
  for (const c of customersData) {
    const created = await prisma.customer.create({ data: c });
    customers.push(created);
  }

  // 7. Seed Historical Financial Transactions (Last 3 Months)
  console.log('Seeding transaction histories (expenses & incomes)...');
  const now = new Date();

  // Helper to generate dynamic dates
  const getDateDaysAgo = (days: number): Date => {
    const d = new Date();
    d.setDate(now.getDate() - days);
    return d;
  };

  // 7a. Seed Expenses
  const expenses = [
    // Month -2
    { title: 'Beli Pisang Tanduk', amount: 900000, categoryId: categoriesMap['buah'], supplierId: suppliers[0].id, productId: products[0].id, transactionDate: getDateDaysAgo(75), note: 'Bahan baku pisang coklat' },
    { title: 'Minyak Goreng Sunco 5 Karton', amount: 350000, categoryId: categoriesMap['minyak'], supplierId: suppliers[2].id, productId: null, transactionDate: getDateDaysAgo(72), note: 'Minyak goreng masak' },
    { title: 'Gaji Karyawan Produksi', amount: 1500000, categoryId: categoriesMap['gaji'], supplierId: null, productId: null, transactionDate: getDateDaysAgo(60), note: 'Gaji bulan lalu' },
    { title: 'Kemasan Plastik Standing Pouch', amount: 600000, categoryId: categoriesMap['packaging'], supplierId: suppliers[1].id, productId: products[0].id, transactionDate: getDateDaysAgo(58), note: 'Kemasan Keripik Pisang' },

    // Month -1
    { title: 'Beli Pisang Tanduk & Kepok', amount: 1100000, categoryId: categoriesMap['buah'], supplierId: suppliers[0].id, productId: products[0].id, transactionDate: getDateDaysAgo(45), note: 'Belanja buah segar' },
    { title: 'Minyak Goreng Sunco 6 Karton', amount: 420000, categoryId: categoriesMap['minyak'], supplierId: suppliers[2].id, productId: null, transactionDate: getDateDaysAgo(42), note: 'Minyak goreng masak' },
    { title: 'Gas Melon 3kg (10 tabung)', amount: 200000, categoryId: categoriesMap['gas'], supplierId: suppliers[2].id, productId: null, transactionDate: getDateDaysAgo(38), note: 'Isi ulang tabung gas' },
    { title: 'Gaji Karyawan Produksi', amount: 1500000, categoryId: categoriesMap['gaji'], supplierId: null, productId: null, transactionDate: getDateDaysAgo(30), note: 'Gaji bulanan' },
    { title: 'Bayar Token Listrik', amount: 250000, categoryId: categoriesMap['listrik'], supplierId: null, productId: null, transactionDate: getDateDaysAgo(28), note: 'Listrik dapur produksi' },

    // Current Month
    { title: 'Beli Singkong Basah 300kg', amount: 750000, categoryId: categoriesMap['buah'], supplierId: suppliers[0].id, productId: products[1].id, transactionDate: getDateDaysAgo(14), note: 'Singkong lokal super' },
    { title: 'Minyak Goreng Bimoli 5 Karton', amount: 380000, categoryId: categoriesMap['minyak'], supplierId: suppliers[2].id, productId: null, transactionDate: getDateDaysAgo(12), note: 'Belanja minyak goreng' },
    { title: 'Beli Pouch Foil Premium', amount: 500000, categoryId: categoriesMap['packaging'], supplierId: suppliers[1].id, productId: products[1].id, transactionDate: getDateDaysAgo(10), note: 'Pouch zipper aluminium foil' },
    { title: 'Ongkos Kirim Bahan Baku', amount: 120000, categoryId: categoriesMap['ongkir'], supplierId: null, productId: null, transactionDate: getDateDaysAgo(8), note: 'Pick-up rental' },
  ];

  for (const exp of expenses) {
    await prisma.expense.create({
      data: {
        title: exp.title,
        amount: exp.amount,
        categoryId: exp.categoryId,
        supplierId: exp.supplierId,
        productId: exp.productId,
        transactionDate: exp.transactionDate,
        note: exp.note,
        userId: admin.id,
      },
    });
  }

  // 7b. Seed Incomes (Laba kotor dihitung dari penjualan retail / reseller)
  const incomes = [
    // Month -2
    { source: 'Toko Swalayan Mitra', amount: 1800000, categoryId: categoriesMap['penjualan-retail'], customerId: null, productId: products[0].id, quantity: 144, hppCost: 7500, netProfit: 144 * (12500 - 7500), transactionDate: getDateDaysAgo(70), description: 'Penjualan cash Keripik Pisang' },
    { source: 'Konsinyasi Koperasi', amount: 650000, categoryId: categoriesMap['konsinyasi'], customerId: null, productId: null, quantity: null, hppCost: 0, netProfit: 650000, transactionDate: getDateDaysAgo(68), description: 'Bagi hasil titip jual singkong' },

    // Month -1
    { source: 'Reseller Agen Jakarta', amount: 2400000, categoryId: categoriesMap['penjualan-reseller'], customerId: customers[0].id, productId: products[0].id, quantity: 200, hppCost: 7500, netProfit: 200 * (12000 - 7500), transactionDate: getDateDaysAgo(40), description: 'Grosir Pisang Coklat' },
    { source: 'Penjualan Harian Retail', amount: 950000, categoryId: categoriesMap['penjualan-retail'], customerId: null, productId: products[1].id, quantity: 120, hppCost: 4500, netProfit: 120 * (8000 - 4500), transactionDate: getDateDaysAgo(35), description: 'Penjualan retail Singkong Pedas' },

    // Current Month
    { source: 'Penjualan Eceran Toko', amount: 1250000, categoryId: categoriesMap['penjualan-retail'], customerId: null, productId: products[0].id, quantity: 100, hppCost: 7500, netProfit: 100 * (12500 - 7500), transactionDate: getDateDaysAgo(15), description: 'Eceran Pisang Coklat cash' },
    { source: 'Toko Oleh-Oleh Bandung', amount: 1600000, categoryId: categoriesMap['penjualan-reseller'], customerId: customers[1].id, productId: products[1].id, quantity: 200, hppCost: 4500, netProfit: 200 * (8000 - 4500), transactionDate: getDateDaysAgo(5), description: 'Grosir Singkong Pedas cash' },
  ];

  for (const inc of incomes) {
    await prisma.income.create({
      data: {
        source: inc.source,
        amount: inc.amount,
        categoryId: inc.categoryId,
        customerId: inc.customerId,
        productId: inc.productId,
        quantity: inc.quantity,
        hppCost: inc.hppCost,
        netProfit: inc.netProfit,
        transactionDate: inc.transactionDate,
        description: inc.description,
        userId: admin.id,
      },
    });
  }

  // 8. Seed Receivables (Piutang Tempo)
  console.log('Seeding receivables & partial payments...');
  
  // Create a tempo sale for Agen Snack Jakarta (Month -1)
  const tempoAmount = 3000000;
  const tempoIncome = await prisma.income.create({
    data: {
      source: 'Agen Snack Jakarta (Tempo)',
      amount: tempoAmount,
      categoryId: categoriesMap['penjualan-reseller'],
      customerId: customers[0].id,
      productId: products[0].id,
      quantity: 250,
      hppCost: 7500,
      netProfit: 250 * (12000 - 7500),
      transactionDate: getDateDaysAgo(25),
      description: 'Penjualan Grosir 250 pack Pisang Coklat tempo',
      userId: admin.id,
    },
  });

  const receivable = await prisma.receivable.create({
    data: {
      incomeId: tempoIncome.id,
      customerId: customers[0].id,
      amount: tempoAmount,
      paidAmount: 1000000, // already paid 1.000.000
      status: 'PARTIAL',
      dueDate: getDateDaysAgo(-15), // due in 15 days
      notes: 'Tempo penjualan 250 pack keripik pisang coklat',
    },
  });

  // Create payment record (creating an income transaction too)
  await prisma.income.create({
    data: {
      source: 'Cicilan 1 - Agen Snack Jakarta',
      amount: 1000000,
      categoryId: categoriesMap['penjualan-reseller'],
      customerId: customers[0].id,
      productId: null,
      quantity: null,
      hppCost: 0,
      netProfit: 1000000,
      transactionDate: getDateDaysAgo(10),
      description: 'Pembayaran cicilan pertama piutang ID: ' + receivable.id,
      userId: admin.id,
    },
  });

  // 9. Seed Audit Logs
  console.log('Seeding audit logs...');
  const auditLogs = [
    { action: 'CREATE_USER', entity: 'User', entityId: admin.id, details: 'Membuat user admin default', userId: admin.id },
    { action: 'CREATE_PRODUCT', entity: 'Product', entityId: products[0].id, details: 'Mendaftarkan produk Keripik Pisang Coklat Premium', userId: admin.id },
    { action: 'CREATE_CUSTOMER', entity: 'Customer', entityId: customers[0].id, details: 'Menambahkan reseller Agen Snack Jakarta', userId: admin.id },
    { action: 'CREATE_INCOME', entity: 'Income', entityId: tempoIncome.id, details: 'Mencatat penjualan tempo reseller Rp 3.000.000 & generate piutang', userId: admin.id },
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({
      data: log,
    });
  }

  console.log('----------------------------------------------------');
  console.log('Seed berhasil diselesaikan!');
  console.log('Admin login : admin@ghinasnack.local / admin12345');
  console.log('Tabel di-seed : Categories, Products, Suppliers, Customers, Incomes, Expenses, Receivables, AuditLogs.');
  console.log('----------------------------------------------------');
}

main()
  .catch((error) => {
    console.error('Seed gagal:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
