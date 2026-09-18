import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Customer from '../models/Customer.js';
import Admin, { DEFAULT_ROLE_PERMISSIONS } from '../models/Admin.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import InventoryLog from '../models/Inventory.js';
import Transaction from '../models/Transaction.js';
import Worker from '../models/Worker.js';
import Setting from '../models/Setting.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { writeData } from './jsonDb.js';

dotenv.config();

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000);
const isoDaysAgo = (days) => daysAgo(days).toISOString();

const seedData = async () => {
  await connectDB();

  console.log('Starting Separated Database Seeding (Admin & Customer)...');

  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@1234', salt);
  const workerPassword = await bcrypt.hash('Worker@1234', salt);
  const customerPassword = await bcrypt.hash('customer123', salt);

  const IDS = {
    admin: '660a1234b123456789abcdef',
    workerDave: '660b1234b123456789abcdef',
    workerMaya: '660b1234b123456789abcde1',
    workerKasun: '660b1234b123456789abcde2',
    customerSarah: '660c1234b123456789abcdef',
    customerNimal: '660c1234b123456789abcde1',
    customerAisha: '660c1234b123456789abcde2',
    anchovy: '660d1234b123456789abcde1',
    shrimp: '660d1234b123456789abcde2',
    eggsA: '660d1234b123456789abcde3',
    wholeChicken: '660d1234b123456789abcde4',
    breast: '660d1234b123456789abcde5',
    mackerel: '660d1234b123456789abcde6',
    eggsB: '660d1234b123456789abcde7',
    wings: '660d1234b123456789abcde8',
    drumsticks: '660d1234b123456789abcde9',
    eggBox: '660d1234b123456789abcdea',
    settings: '660e1234b123456789abcdef',
    workerRecDave: '660f1234b123456789abcdef',
    workerRecMaya: '660f1234b123456789abcde1',
    workerRecKasun: '660f1234b123456789abcde2',
    orderSarahDelivered: '660f7774b123456789abcde1',
    orderSarahPending: '660f7774b123456789abcde2',
    orderSarahShipped: '660f7774b123456789abcde3',
    orderSarahProcessing: '660f7774b123456789abcde4',
    orderNimalDelivered: '660f7774b123456789abcde5',
    orderNimalCancelled: '660f7774b123456789abcde6',
    orderAishaProcessing: '660f7774b123456789abcde7',
  };

  const sarahAddress = {
    street: '456 Garden Avenue',
    city: 'Bloomfield',
    state: 'SunnyState',
    zipCode: '10001',
    country: 'Agroland',
  };
  const nimalAddress = {
    street: '12 Lighthouse Road',
    city: 'Galle',
    state: 'Southern Province',
    zipCode: '80000',
    country: 'Sri Lanka',
  };
  const aishaAddress = {
    street: '88 Marine Drive',
    city: 'Colombo',
    state: 'Western Province',
    zipCode: '00300',
    country: 'Sri Lanka',
  };

  // 1. Admins
  const admins = [
    {
      _id: IDS.admin,
      name: 'Super Administrator',
      email: 'admin@ripomafarm.com',
      password: adminPassword,
      role: 'super_admin',
      permissions: DEFAULT_ROLE_PERMISSIONS.super_admin,
      two_factor_enabled: true,
      two_factor_secret: 'RIPOMA-SECURE-2FA-FARM',
      status: 'active',
      phone: '+1 (555) 012-3456',
      failedLoginAttempts: 0,
      lockoutUntil: null,
      loginHistory: [],
      createdAt: isoDaysAgo(90),
    },
    {
      _id: IDS.workerDave,
      name: 'Worker Dave',
      email: 'worker@ripomafarm.com',
      password: workerPassword,
      role: 'supervisor',
      permissions: DEFAULT_ROLE_PERMISSIONS.supervisor,
      two_factor_enabled: true,
      two_factor_secret: 'RIPOMA-SECURE-2FA-FARM',
      status: 'active',
      phone: '+1 (555) 012-7890',
      failedLoginAttempts: 0,
      lockoutUntil: null,
      loginHistory: [],
      createdAt: isoDaysAgo(60),
    },
    {
      _id: IDS.workerMaya,
      name: 'Maya Packer',
      email: 'maya@ripomafarm.com',
      password: workerPassword,
      role: 'packer',
      permissions: DEFAULT_ROLE_PERMISSIONS.packer,
      two_factor_enabled: false,
      two_factor_secret: '',
      status: 'active',
      phone: '+94 77 555 2100',
      failedLoginAttempts: 0,
      lockoutUntil: null,
      loginHistory: [],
      createdAt: isoDaysAgo(45),
    },
    {
      _id: IDS.workerKasun,
      name: 'Kasun Fisher',
      email: 'kasun@ripomafarm.com',
      password: workerPassword,
      role: 'fisher',
      permissions: DEFAULT_ROLE_PERMISSIONS.fisher,
      two_factor_enabled: false,
      two_factor_secret: '',
      status: 'active',
      phone: '+94 76 555 3344',
      failedLoginAttempts: 0,
      lockoutUntil: null,
      loginHistory: [],
      createdAt: isoDaysAgo(40),
    },
  ];

  // 2. Customers
  const customers = [
    {
      _id: IDS.customerSarah,
      name: 'Sarah Customer',
      email: 'customer@ripomafarm.com',
      password: customerPassword,
      phone: '+1 (555) 012-5555',
      addresses: [{ ...sarahAddress, isDefault: true }],
      loyalty_points: 185,
      wishlist: [IDS.eggsA, IDS.anchovy],
      status: 'active',
      failedLoginAttempts: 0,
      lockoutUntil: null,
      loginHistory: [],
      createdAt: isoDaysAgo(30),
    },
    {
      _id: IDS.customerNimal,
      name: 'Nimal Perera',
      email: 'nimal@example.com',
      password: customerPassword,
      phone: '+94 71 222 8899',
      addresses: [{ ...nimalAddress, isDefault: true }],
      loyalty_points: 62,
      wishlist: [IDS.mackerel, IDS.wholeChicken],
      status: 'active',
      failedLoginAttempts: 0,
      lockoutUntil: null,
      loginHistory: [],
      createdAt: isoDaysAgo(21),
    },
    {
      _id: IDS.customerAisha,
      name: 'Aisha Fernando',
      email: 'aisha@example.com',
      password: customerPassword,
      phone: '+94 75 444 1200',
      addresses: [{ ...aishaAddress, isDefault: true }],
      loyalty_points: 40,
      wishlist: [IDS.shrimp],
      status: 'active',
      failedLoginAttempts: 0,
      lockoutUntil: null,
      loginHistory: [],
      createdAt: isoDaysAgo(10),
    },
  ];

  // 3. Categories
  const categories = [
    { name: 'Dry Fish', description: 'Sun-dried high quality marine fish, processed hygienically.', subcategories: ['Anchovy', 'Shrimp', 'Mackerel'] },
    { name: 'Eggs', description: 'Fresh, organic free-range chicken eggs gathered daily.', subcategories: ['Tray Pack', 'Box Pack', 'Grade A', 'Grade B'] },
    { name: 'Chicken', description: 'Organic farm-raised fresh chicken cuts and whole chickens.', subcategories: ['Whole Chicken', 'Cuts', 'Wings', 'Drumsticks', 'Breasts'] },
  ];

  // 4. Products
  const products = [
    {
      _id: IDS.anchovy,
      name: 'Sun-Dried Anchovy (Neetholi)',
      description: 'Hygienically sun-dried Anchovies. Rich in Calcium, Protein, and Omega-3. Salted moderately and packed tightly to preserve freshness.',
      category: 'Dry Fish',
      subcategory: 'Anchovy',
      images: ['https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600'],
      basePrice: 8.50,
      costPrice: 4.20,
      discount: 10,
      stock: 75,
      sku: 'RIP-DRY-ANC01',
      variants: [
        { name: '100g Pack', price: 8.50, costPrice: 4.20, stock: 30, sku: 'RIP-DRY-ANC-100' },
        { name: '250g Pack', price: 19.50, costPrice: 9.80, stock: 25, sku: 'RIP-DRY-ANC-250' },
        { name: '500g Pack', price: 36.00, costPrice: 18.00, stock: 20, sku: 'RIP-DRY-ANC-500' },
      ],
      specifications: { Size: 'Medium', Type: 'Salted', ShelfLife: '6 Months', Origin: 'Coastal Harvest' },
      rating: 4.8,
      reviews: [
        { userName: 'Sarah Customer', rating: 5, comment: 'Very clean and tasty. Not too salty!', createdAt: daysAgo(20) },
        { userName: 'Nimal Perera', rating: 4, comment: 'Good for coconut sambol. Will order the 500g next time.', createdAt: daysAgo(8) },
      ],
    },
    {
      _id: IDS.shrimp,
      name: 'Premium Dried Shrimp (Chemmeen)',
      description: 'Handpicked and sun-dried organic prawns. Shell removed, ready to cook. No artificial colors or preservatives added.',
      category: 'Dry Fish',
      subcategory: 'Shrimp',
      images: ['https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600'],
      basePrice: 12.00,
      costPrice: 6.00,
      discount: 0,
      stock: 45,
      sku: 'RIP-DRY-SHR01',
      variants: [
        { name: '100g Pack', price: 12.00, costPrice: 6.00, stock: 25, sku: 'RIP-DRY-SHR-100' },
        { name: '250g Pack', price: 27.50, costPrice: 13.50, stock: 20, sku: 'RIP-DRY-SHR-250' },
      ],
      specifications: { Size: 'Large', Type: 'Unsalted', ShelfLife: '6 Months', Origin: 'Coastal Harvest' },
      rating: 4.6,
      reviews: [
        { userName: 'Aisha Fernando', rating: 5, comment: 'Sweet, clean shrimp. Perfect in fried rice.', createdAt: daysAgo(4) },
      ],
    },
    {
      _id: IDS.mackerel,
      name: 'Sun-Dried Mackerel (Kumbalava)',
      description: 'Coastal mackerel split, salted, and solar-dried. Deep flavor for curries and fried dry-fish dishes.',
      category: 'Dry Fish',
      subcategory: 'Mackerel',
      images: ['https://images.unsplash.com/photo-1498654200943-1088dd8448f8?w=600'],
      basePrice: 10.50,
      costPrice: 5.20,
      discount: 5,
      stock: 38,
      sku: 'RIP-DRY-MAC01',
      variants: [
        { name: '250g Pack', price: 10.50, costPrice: 5.20, stock: 22, sku: 'RIP-DRY-MAC-250' },
        { name: '500g Pack', price: 19.80, costPrice: 9.80, stock: 16, sku: 'RIP-DRY-MAC-500' },
      ],
      specifications: { Size: 'Medium', Type: 'Salted', ShelfLife: '5 Months', Origin: 'Southern Coast' },
      rating: 4.7,
      reviews: [
        { userName: 'Nimal Perera', rating: 5, comment: 'Tastes like the dry fish from the Galle market.', createdAt: daysAgo(6) },
      ],
    },
    {
      _id: IDS.eggsA,
      name: 'Organic Farm Fresh Eggs (Brown)',
      description: 'Nutritious, brown-shelled eggs from free-range pasture-raised chickens fed with organic grains. Gathered daily.',
      category: 'Eggs',
      subcategory: 'Grade A',
      images: ['https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=600'],
      basePrice: 9.99,
      costPrice: 4.50,
      discount: 5,
      stock: 120,
      sku: 'RIP-EGG-FRESH',
      variants: [
        { name: 'Tray of 30 (Grade A)', price: 9.99, costPrice: 4.50, stock: 80, sku: 'RIP-EGG-T30-A' },
        { name: 'Box of 300 (Grade A)', price: 89.99, costPrice: 40.00, stock: 40, sku: 'RIP-EGG-B300-A' },
      ],
      specifications: { Grade: 'Grade A', Color: 'Brown', Feed: 'Organic Grains', FarmType: 'Free Range' },
      rating: 4.9,
      reviews: [
        { userName: 'Sarah Customer', rating: 5, comment: 'Yolks are deep yellow and taste amazing! Highly recommend.', createdAt: daysAgo(18) },
        { userName: 'Aisha Fernando', rating: 5, comment: 'Best eggs we have used for baking.', createdAt: daysAgo(3) },
      ],
    },
    {
      _id: IDS.eggsB,
      name: 'Farm Eggs Tray Pack (Grade B)',
      description: 'Everyday cooking eggs from the same pasture flock. Slightly smaller Grade B shells, packed in 12 and 30 trays.',
      category: 'Eggs',
      subcategory: 'Tray Pack',
      images: ['https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600'],
      basePrice: 4.50,
      costPrice: 2.10,
      discount: 0,
      stock: 90,
      sku: 'RIP-EGG-B-TRAY',
      variants: [
        { name: 'Tray of 12 (Grade B)', price: 4.50, costPrice: 2.10, stock: 50, sku: 'RIP-EGG-T12-B' },
        { name: 'Tray of 30 (Grade B)', price: 8.40, costPrice: 3.90, stock: 40, sku: 'RIP-EGG-T30-B' },
      ],
      specifications: { Grade: 'Grade B', Color: 'Brown', Pack: 'Tray', FarmType: 'Free Range' },
      rating: 4.4,
      reviews: [],
    },
    {
      _id: IDS.eggBox,
      name: 'Wholesale Egg Box Pack',
      description: 'Restaurant and bakery carton of 300 pasture eggs. Graded, stamped, and packed for bulk kitchens.',
      category: 'Eggs',
      subcategory: 'Box Pack',
      images: ['https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=600'],
      basePrice: 79.00,
      costPrice: 36.00,
      discount: 8,
      stock: 18,
      sku: 'RIP-EGG-BOX300',
      variants: [
        { name: 'Box of 300 (Mixed Grade)', price: 79.00, costPrice: 36.00, stock: 18, sku: 'RIP-EGG-BOX-300' },
      ],
      specifications: { Grade: 'Mixed', Color: 'Brown', Pack: 'Wholesale Box', FarmType: 'Free Range' },
      rating: 4.5,
      reviews: [],
    },
    {
      _id: IDS.wholeChicken,
      name: 'Whole Broiler Chicken',
      description: 'Fresh whole chicken, fully cleaned, gutted, and dressed. Frozen or fresh option. Tender, juicy meat, perfect for roasting.',
      category: 'Chicken',
      subcategory: 'Whole Chicken',
      images: ['https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600'],
      basePrice: 14.50,
      costPrice: 7.00,
      discount: 0,
      stock: 60,
      sku: 'RIP-CHK-WHOLE',
      variants: [
        { name: '1.2kg Size', price: 14.50, costPrice: 7.00, stock: 20, sku: 'RIP-CHK-W-12' },
        { name: '1.5kg Size', price: 17.80, costPrice: 8.50, stock: 25, sku: 'RIP-CHK-W-15' },
        { name: '1.8kg Size', price: 21.00, costPrice: 10.00, stock: 15, sku: 'RIP-CHK-W-18' },
      ],
      specifications: { Type: 'Broiler', Preparation: 'Fully Dressed', Freshness: 'Fresh Farm Cut', Feed: 'Corn-fed' },
      rating: 4.7,
      reviews: [
        { userName: 'Nimal Perera', rating: 5, comment: 'Juicy roast. The 1.5kg size fed our family of four.', createdAt: daysAgo(12) },
      ],
    },
    {
      _id: IDS.breast,
      name: 'Premium Chicken Breast (Boneless)',
      description: 'Skinless and boneless chicken breast cuts. Tender and high in protein, ideal for gym diets, grilling, or curries.',
      category: 'Chicken',
      subcategory: 'Breasts',
      images: ['https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600'],
      basePrice: 8.99,
      costPrice: 4.00,
      discount: 15,
      stock: 8,
      sku: 'RIP-CHK-BREAST',
      variants: [
        { name: '500g Pack', price: 8.99, costPrice: 4.00, stock: 5, sku: 'RIP-CHK-B-500' },
        { name: '1kg Pack', price: 16.99, costPrice: 8.00, stock: 3, sku: 'RIP-CHK-B-1000' },
      ],
      specifications: { Type: 'Boneless', Prep: 'Skinless Cuts', Packaging: 'Vaccum Sealed', Temp: 'Chilled' },
      rating: 4.5,
      reviews: [],
    },
    {
      _id: IDS.wings,
      name: 'Pasture Chicken Wings',
      description: 'Fresh mid-joint and drumette mix. Ideal for grilling, buffalo sauce, or pepper fry.',
      category: 'Chicken',
      subcategory: 'Wings',
      images: ['https://images.unsplash.com/photo-1527477396000-e27163b50860?w=600'],
      basePrice: 7.50,
      costPrice: 3.40,
      discount: 0,
      stock: 42,
      sku: 'RIP-CHK-WINGS',
      variants: [
        { name: '500g Pack', price: 7.50, costPrice: 3.40, stock: 24, sku: 'RIP-CHK-WG-500' },
        { name: '1kg Pack', price: 13.90, costPrice: 6.40, stock: 18, sku: 'RIP-CHK-WG-1000' },
      ],
      specifications: { Type: 'Wings Mix', Prep: 'Cleaned', Packaging: 'Chilled Tray', Temp: 'Chilled' },
      rating: 4.6,
      reviews: [],
    },
    {
      _id: IDS.drumsticks,
      name: 'Farm Chicken Drumsticks',
      description: 'Meaty drumsticks from pasture birds. Bone-in, skin-on, ready for curry or oven roast.',
      category: 'Chicken',
      subcategory: 'Drumsticks',
      images: ['https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600'],
      basePrice: 6.80,
      costPrice: 3.10,
      discount: 10,
      stock: 55,
      sku: 'RIP-CHK-DRUM',
      variants: [
        { name: '500g Pack', price: 6.80, costPrice: 3.10, stock: 30, sku: 'RIP-CHK-DR-500' },
        { name: '1kg Pack', price: 12.50, costPrice: 5.80, stock: 25, sku: 'RIP-CHK-DR-1000' },
      ],
      specifications: { Type: 'Bone-in', Prep: 'Skin-on', Packaging: 'Chilled Tray', Temp: 'Chilled' },
      rating: 4.8,
      reviews: [
        { userName: 'Sarah Customer', rating: 5, comment: 'Crisped up beautifully in the oven.', createdAt: daysAgo(2) },
      ],
    },
  ];

  // 5. Global Settings
  const settings = [
    {
      _id: IDS.settings,
      key: 'global_settings',
      companyName: 'RIPOMA Farm & Foods',
      contactEmail: 'support@ripomafarm.com',
      contactPhone: '+1 (555) 747-6622',
      address: '10 Organic Way, Agro Valley, GreenState',
      taxRate: 5,
      shippingFee: 8.50,
      currency: 'USD',
      stripeEnabled: true,
      paypalEnabled: false,
      cashOnDeliveryEnabled: true,
    },
  ];

  // 6. Workers
  const workers = [
    {
      _id: IDS.workerRecDave,
      userId: IDS.workerDave,
      name: 'Worker Dave',
      email: 'worker@ripomafarm.com',
      phone: '+1 (555) 012-7890',
      status: 'active',
      role: 'Poultry Supervisor',
      hourlyRate: 18,
      tasks: [
        { _id: '660f1234b123456789abcd01', title: 'Feed Chickens in Barn B', description: 'Ensure the corn feeder is full before 5 PM', status: 'completed', assignedDate: isoDaysAgo(1) },
        { _id: '660f1234b123456789abcd02', title: 'Gather eggs from Barn A', description: 'Collect and grade brown eggs into trays', status: 'in_progress', assignedDate: new Date().toISOString() },
        { _id: '660f1234b123456789abcd03', title: 'Clean Barn C', description: 'Sanitize nests and floorboards', status: 'todo', assignedDate: new Date().toISOString() },
      ],
      attendance: [
        { date: daysAgo(2).toISOString().split('T')[0], status: 'present' },
        { date: daysAgo(1).toISOString().split('T')[0], status: 'present' },
        { date: new Date().toISOString().split('T')[0], status: 'present' },
      ],
    },
    {
      _id: IDS.workerRecMaya,
      userId: IDS.workerMaya,
      name: 'Maya Packer',
      email: 'maya@ripomafarm.com',
      phone: '+94 77 555 2100',
      status: 'active',
      role: 'Packager',
      hourlyRate: 15,
      tasks: [
        { _id: '660f1234b123456789abcd11', title: 'Pack Grade A egg trays', description: 'Stamp and crate 40 trays for tomorrow’s van', status: 'completed', assignedDate: isoDaysAgo(1) },
        { _id: '660f1234b123456789abcd12', title: 'Label dry-fish 250g packs', description: 'Neetholi and Chemmeen SKUs for weekend orders', status: 'in_progress', assignedDate: new Date().toISOString() },
        { _id: '660f1234b123456789abcd13', title: 'Ice-pack chicken wings', description: 'Chill 1kg wing packs before dispatch', status: 'todo', assignedDate: new Date().toISOString() },
      ],
      attendance: [
        { date: daysAgo(2).toISOString().split('T')[0], status: 'present' },
        { date: daysAgo(1).toISOString().split('T')[0], status: 'leave' },
        { date: new Date().toISOString().split('T')[0], status: 'present' },
      ],
    },
    {
      _id: IDS.workerRecKasun,
      userId: IDS.workerKasun,
      name: 'Kasun Fisher',
      email: 'kasun@ripomafarm.com',
      phone: '+94 76 555 3344',
      status: 'active',
      role: 'Coastal Fisher',
      hourlyRate: 16,
      tasks: [
        { _id: '660f1234b123456789abcd21', title: 'Morning anchovy harvest', description: 'Bring catch to solar drying racks', status: 'completed', assignedDate: isoDaysAgo(1) },
        { _id: '660f1234b123456789abcd22', title: 'Turn drying mackerel', description: 'Flip racks at 10 AM and 3 PM', status: 'in_progress', assignedDate: new Date().toISOString() },
        { _id: '660f1234b123456789abcd23', title: 'Net repair', description: 'Mend small-mesh nets before next tide', status: 'todo', assignedDate: new Date().toISOString() },
      ],
      attendance: [
        { date: daysAgo(2).toISOString().split('T')[0], status: 'present' },
        { date: daysAgo(1).toISOString().split('T')[0], status: 'present' },
        { date: new Date().toISOString().split('T')[0], status: 'absent' },
      ],
    },
  ];

  // 7. Orders
  const orders = [
    {
      _id: IDS.orderSarahDelivered,
      user: IDS.customerSarah,
      customerDetails: { name: 'Sarah Customer', email: 'customer@ripomafarm.com', phone: '+1 (555) 012-5555', ...sarahAddress },
      items: [
        { productId: IDS.eggsA, name: 'Organic Farm Fresh Eggs (Brown)', image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=600', variantName: 'Tray of 30 (Grade A)', quantity: 2, price: 9.99, costPrice: 4.50 },
        { productId: IDS.anchovy, name: 'Sun-Dried Anchovy (Neetholi)', image: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600', variantName: '100g Pack', quantity: 1, price: 8.50, costPrice: 4.20 },
      ],
      subtotal: 28.48,
      shippingFee: 8.50,
      tax: 1.42,
      total: 38.40,
      paymentMethod: 'Stripe',
      paymentStatus: 'paid',
      orderStatus: 'Delivered',
      invoiceNumber: 'INV-1204-098',
      trackingNumber: 'RIPOMA-TRK-1204',
      createdAt: isoDaysAgo(30),
    },
    {
      _id: IDS.orderSarahPending,
      user: IDS.customerSarah,
      customerDetails: { name: 'Sarah Customer', email: 'customer@ripomafarm.com', phone: '+1 (555) 012-5555', ...sarahAddress },
      items: [
        { productId: IDS.wholeChicken, name: 'Whole Broiler Chicken', image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600', variantName: '1.5kg Size', quantity: 1, price: 17.80, costPrice: 8.50 },
      ],
      subtotal: 17.80,
      shippingFee: 8.50,
      tax: 0.89,
      total: 27.19,
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'pending',
      orderStatus: 'Pending',
      invoiceNumber: 'INV-0604-001',
      trackingNumber: '',
      createdAt: hoursAgo(12).toISOString(),
    },
    {
      _id: IDS.orderSarahShipped,
      user: IDS.customerSarah,
      customerDetails: { name: 'Sarah Customer', email: 'customer@ripomafarm.com', phone: '+1 (555) 012-5555', ...sarahAddress },
      items: [
        { productId: IDS.drumsticks, name: 'Farm Chicken Drumsticks', image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600', variantName: '1kg Pack', quantity: 2, price: 12.50, costPrice: 5.80 },
        { productId: IDS.eggsB, name: 'Farm Eggs Tray Pack (Grade B)', image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600', variantName: 'Tray of 12 (Grade B)', quantity: 1, price: 4.50, costPrice: 2.10 },
      ],
      subtotal: 29.50,
      shippingFee: 8.50,
      tax: 1.48,
      total: 39.48,
      paymentMethod: 'Stripe',
      paymentStatus: 'paid',
      orderStatus: 'Shipped',
      invoiceNumber: 'INV-0912-044',
      trackingNumber: 'RIPOMA-TRK-0912',
      createdAt: isoDaysAgo(6),
    },
    {
      _id: IDS.orderSarahProcessing,
      user: IDS.customerSarah,
      customerDetails: { name: 'Sarah Customer', email: 'customer@ripomafarm.com', phone: '+1 (555) 012-5555', ...sarahAddress },
      items: [
        { productId: IDS.wings, name: 'Pasture Chicken Wings', image: 'https://images.unsplash.com/photo-1527477396000-e27163b50860?w=600', variantName: '500g Pack', quantity: 2, price: 7.50, costPrice: 3.40 },
      ],
      subtotal: 15.00,
      shippingFee: 8.50,
      tax: 0.75,
      total: 24.25,
      paymentMethod: 'Stripe',
      paymentStatus: 'paid',
      orderStatus: 'Processing',
      invoiceNumber: 'INV-0917-012',
      trackingNumber: '',
      createdAt: isoDaysAgo(1),
    },
    {
      _id: IDS.orderNimalDelivered,
      user: IDS.customerNimal,
      customerDetails: { name: 'Nimal Perera', email: 'nimal@example.com', phone: '+94 71 222 8899', ...nimalAddress },
      items: [
        { productId: IDS.mackerel, name: 'Sun-Dried Mackerel (Kumbalava)', image: 'https://images.unsplash.com/photo-1498654200943-1088dd8448f8?w=600', variantName: '500g Pack', quantity: 1, price: 19.80, costPrice: 9.80 },
        { productId: IDS.wholeChicken, name: 'Whole Broiler Chicken', image: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=600', variantName: '1.5kg Size', quantity: 1, price: 17.80, costPrice: 8.50 },
      ],
      subtotal: 37.60,
      shippingFee: 8.50,
      tax: 1.88,
      total: 47.98,
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'paid',
      orderStatus: 'Delivered',
      invoiceNumber: 'INV-0901-077',
      trackingNumber: 'RIPOMA-TRK-0901',
      createdAt: isoDaysAgo(17),
    },
    {
      _id: IDS.orderNimalCancelled,
      user: IDS.customerNimal,
      customerDetails: { name: 'Nimal Perera', email: 'nimal@example.com', phone: '+94 71 222 8899', ...nimalAddress },
      items: [
        { productId: IDS.breast, name: 'Premium Chicken Breast (Boneless)', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600', variantName: '1kg Pack', quantity: 1, price: 16.99, costPrice: 8.00 },
      ],
      subtotal: 16.99,
      shippingFee: 8.50,
      tax: 0.85,
      total: 26.34,
      paymentMethod: 'Stripe',
      paymentStatus: 'refunded',
      orderStatus: 'Cancelled',
      invoiceNumber: 'INV-0910-019',
      trackingNumber: '',
      createdAt: isoDaysAgo(8),
    },
    {
      _id: IDS.orderAishaProcessing,
      user: IDS.customerAisha,
      customerDetails: { name: 'Aisha Fernando', email: 'aisha@example.com', phone: '+94 75 444 1200', ...aishaAddress },
      items: [
        { productId: IDS.shrimp, name: 'Premium Dried Shrimp (Chemmeen)', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600', variantName: '250g Pack', quantity: 1, price: 27.50, costPrice: 13.50 },
        { productId: IDS.eggsA, name: 'Organic Farm Fresh Eggs (Brown)', image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=600', variantName: 'Tray of 30 (Grade A)', quantity: 1, price: 9.99, costPrice: 4.50 },
      ],
      subtotal: 37.49,
      shippingFee: 8.50,
      tax: 1.87,
      total: 47.86,
      paymentMethod: 'Stripe',
      paymentStatus: 'paid',
      orderStatus: 'Processing',
      invoiceNumber: 'INV-0916-031',
      trackingNumber: '',
      createdAt: isoDaysAgo(2),
    },
  ];

  // 8. Transactions
  const transactions = [
    { type: 'income', amount: 480.00, costOfGoods: 220.00, category: 'sales', description: 'March Sales Aggregation', date: new Date('2026-03-25T12:00:00Z') },
    { type: 'expense', amount: 150.00, category: 'salary', description: 'Dave Wages March', date: new Date('2026-03-30T17:00:00Z') },
    { type: 'expense', amount: 90.00, category: 'inventory_purchase', description: 'Feed purchase Barn A', date: new Date('2026-03-05T09:00:00Z') },
    { type: 'income', amount: 720.00, costOfGoods: 310.00, category: 'sales', description: 'April Sales Aggregation', date: new Date('2026-04-20T12:00:00Z') },
    { type: 'expense', amount: 150.00, category: 'salary', description: 'Dave Wages April', date: new Date('2026-04-30T17:00:00Z') },
    { type: 'expense', amount: 120.00, category: 'inventory_purchase', description: 'Egg box cartons bought', date: new Date('2026-04-12T10:00:00Z') },
    { type: 'income', amount: 1150.00, costOfGoods: 530.00, category: 'sales', description: 'May Sales Aggregation', date: new Date('2026-05-18T12:00:00Z') },
    { type: 'expense', amount: 180.00, category: 'salary', description: 'Dave Wages May', date: new Date('2026-05-31T17:00:00Z') },
    { type: 'expense', amount: 80.00, category: 'other_expense', description: 'Power/Utilities Barn B', date: new Date('2026-05-15T08:00:00Z') },
    { type: 'income', amount: 980.00, costOfGoods: 440.00, category: 'sales', description: 'June Sales Aggregation', date: new Date('2026-06-22T12:00:00Z') },
    { type: 'expense', amount: 330.00, category: 'salary', description: 'Dave, Maya & Kasun wages June', date: new Date('2026-06-30T17:00:00Z') },
    { type: 'expense', amount: 140.00, category: 'inventory_purchase', description: 'Corn feed and oyster grit', date: new Date('2026-06-08T09:00:00Z') },
    { type: 'income', amount: 1260.00, costOfGoods: 560.00, category: 'sales', description: 'July Sales Aggregation', date: new Date('2026-07-20T12:00:00Z') },
    { type: 'expense', amount: 330.00, category: 'salary', description: 'Dave, Maya & Kasun wages July', date: new Date('2026-07-31T17:00:00Z') },
    { type: 'expense', amount: 95.00, category: 'shipping', description: 'Van fuel Southern route', date: new Date('2026-07-14T08:00:00Z') },
    { type: 'income', amount: 1410.00, costOfGoods: 610.00, category: 'sales', description: 'August Sales Aggregation', date: new Date('2026-08-19T12:00:00Z') },
    { type: 'expense', amount: 345.00, category: 'salary', description: 'Dave, Maya & Kasun wages August', date: new Date('2026-08-31T17:00:00Z') },
    { type: 'expense', amount: 75.00, category: 'other_expense', description: 'Ice and vacuum bags', date: new Date('2026-08-11T10:00:00Z') },
    { type: 'income', amount: 38.40, costOfGoods: 13.20, category: 'sales', description: 'Order INV-1204-098', referenceId: IDS.orderSarahDelivered, date: daysAgo(30) },
    { type: 'income', amount: 47.98, costOfGoods: 18.30, category: 'sales', description: 'Order INV-0901-077', referenceId: IDS.orderNimalDelivered, date: daysAgo(17) },
    { type: 'income', amount: 39.48, costOfGoods: 13.70, category: 'sales', description: 'Order INV-0912-044', referenceId: IDS.orderSarahShipped, date: daysAgo(6) },
    { type: 'income', amount: 47.86, costOfGoods: 18.00, category: 'sales', description: 'Order INV-0916-031', referenceId: IDS.orderAishaProcessing, date: daysAgo(2) },
    { type: 'income', amount: 24.25, costOfGoods: 6.80, category: 'sales', description: 'Order INV-0917-012', referenceId: IDS.orderSarahProcessing, date: daysAgo(1) },
    { type: 'income', amount: 27.19, costOfGoods: 8.50, category: 'sales', description: 'Order INV-0604-001', referenceId: IDS.orderSarahPending, date: hoursAgo(12) },
  ];

  // 9. Notifications
  const notifications = [
    { title: 'Welcome to Ripoma Farm', message: 'The Ripoma Farm storefront is ready. Browse today’s harvest of eggs, chicken, and solar-dried fish.', type: 'info', roleRecipient: 'customer', userId: null, read: false, createdAt: daysAgo(30) },
    { title: 'Harvest points posted', message: 'You earned 18 harvest points on invoice INV-1204-098. Current balance: 185 pts.', type: 'success', roleRecipient: 'customer', userId: IDS.customerSarah, read: false, createdAt: daysAgo(29) },
    { title: 'Your order is on the way', message: 'Invoice INV-0912-044 (drumsticks & eggs) has shipped. Tracking: RIPOMA-TRK-0912.', type: 'info', roleRecipient: 'customer', userId: IDS.customerSarah, read: false, createdAt: daysAgo(5) },
    { title: 'Kitchen restock reminder', message: 'Pasture chicken wings are packed and will leave the farm tomorrow morning.', type: 'info', roleRecipient: 'customer', userId: IDS.customerSarah, read: false, createdAt: hoursAgo(8) },
    { title: 'Order delivered', message: 'Invoice INV-0901-077 reached Galle. Thank you for sourcing from Ripoma Farm.', type: 'success', roleRecipient: 'customer', userId: IDS.customerNimal, read: false, createdAt: daysAgo(14) },
    { title: 'Low Stock Alert', message: 'Product "Premium Chicken Breast (Boneless)" is running low. Current stock: 8.', type: 'warning', roleRecipient: 'admin', userId: null, read: false, createdAt: daysAgo(1) },
    { title: 'New storefront order', message: 'Order INV-0917-012 placed by Sarah Customer (wings, $24.25).', type: 'info', roleRecipient: 'admin', userId: null, read: false, createdAt: daysAgo(1) },
    { title: 'Refund processed', message: 'Invoice INV-0910-019 was cancelled and refunded to Nimal Perera.', type: 'warning', roleRecipient: 'admin', userId: null, read: true, createdAt: daysAgo(8) },
    { title: 'Egg collection due', message: 'Barn A trays still need grading before the 4 PM van.', type: 'warning', roleRecipient: 'worker', userId: null, read: false, createdAt: hoursAgo(3) },
    { title: 'Dry-fish racks', message: 'Turn the mackerel drying racks at 3 PM today.', type: 'info', roleRecipient: 'worker', userId: null, read: false, createdAt: hoursAgo(6) },
  ];

  // 10. Inventory Logs
  const inventorylogs = [
    { productId: IDS.breast, productName: 'Premium Chicken Breast (Boneless)', variantName: '500g Pack', changeType: 'restock', quantityChanged: 5, stockAfterChange: 5, description: 'Initial seed stock', performedBy: 'Super Administrator', createdAt: isoDaysAgo(5) },
    { productId: IDS.breast, productName: 'Premium Chicken Breast (Boneless)', variantName: '1kg Pack', changeType: 'restock', quantityChanged: 3, stockAfterChange: 3, description: 'Initial seed stock', performedBy: 'Super Administrator', createdAt: isoDaysAgo(5) },
    { productId: IDS.eggsA, productName: 'Organic Farm Fresh Eggs (Brown)', variantName: 'Tray of 30 (Grade A)', changeType: 'restock', quantityChanged: 80, stockAfterChange: 80, description: 'Morning collection Barn A', performedBy: 'Worker Dave', createdAt: isoDaysAgo(4) },
    { productId: IDS.eggsA, productName: 'Organic Farm Fresh Eggs (Brown)', variantName: 'Tray of 30 (Grade A)', changeType: 'sale', quantityChanged: -2, stockAfterChange: 78, description: 'Order INV-1204-098', performedBy: 'Maya Packer', createdAt: isoDaysAgo(30) },
    { productId: IDS.anchovy, productName: 'Sun-Dried Anchovy (Neetholi)', variantName: '100g Pack', changeType: 'restock', quantityChanged: 30, stockAfterChange: 30, description: 'Packed after solar dry', performedBy: 'Kasun Fisher', createdAt: isoDaysAgo(7) },
    { productId: IDS.mackerel, productName: 'Sun-Dried Mackerel (Kumbalava)', variantName: '500g Pack', changeType: 'sale', quantityChanged: -1, stockAfterChange: 16, description: 'Order INV-0901-077', performedBy: 'Maya Packer', createdAt: isoDaysAgo(17) },
    { productId: IDS.drumsticks, productName: 'Farm Chicken Drumsticks', variantName: '1kg Pack', changeType: 'sale', quantityChanged: -2, stockAfterChange: 23, description: 'Order INV-0912-044', performedBy: 'Maya Packer', createdAt: isoDaysAgo(6) },
    { productId: IDS.wings, productName: 'Pasture Chicken Wings', variantName: '500g Pack', changeType: 'adjustment', quantityChanged: -2, stockAfterChange: 22, description: 'Trim loss after portioning', performedBy: 'Worker Dave', createdAt: isoDaysAgo(3) },
    { productId: IDS.breast, productName: 'Premium Chicken Breast (Boneless)', variantName: '1kg Pack', changeType: 'return', quantityChanged: 1, stockAfterChange: 4, description: 'Cancelled order INV-0910-019 restocked', performedBy: 'Super Administrator', createdAt: isoDaysAgo(8) },
  ];

  // 11. Audit logs
  const auditlogs = [
    { userId: IDS.admin, userName: 'Super Administrator', action: 'seed_database', description: 'Loaded sample catalog, customers, orders, and workers.', ipAddress: '127.0.0.1', createdAt: new Date() },
    { userId: IDS.admin, userName: 'Super Administrator', action: 'change_order_status', description: 'Marked INV-1204-098 as Delivered.', ipAddress: '127.0.0.1', createdAt: daysAgo(28) },
    { userId: IDS.workerDave, userName: 'Worker Dave', action: 'update_inventory', description: 'Restocked Grade A egg trays after Barn A collection.', ipAddress: '127.0.0.1', createdAt: daysAgo(4) },
    { userId: IDS.admin, userName: 'Super Administrator', action: 'change_order_status', description: 'Cancelled and refunded INV-0910-019.', ipAddress: '127.0.0.1', createdAt: daysAgo(8) },
  ];

  if (global.dbConnected) {
    try {
      await Admin.deleteMany({});
      await Customer.deleteMany({});
      await User.deleteMany({});
      await Product.deleteMany({});
      await Category.deleteMany({});
      await Order.deleteMany({});
      await InventoryLog.deleteMany({});
      await Transaction.deleteMany({});
      await Worker.deleteMany({});
      await Setting.deleteMany({});
      await Notification.deleteMany({});
      await AuditLog.deleteMany({});

      await Admin.insertMany(admins);
      await Customer.insertMany(customers);
      await Category.insertMany(categories);
      await Product.insertMany(products);
      await Setting.insertMany(settings);
      await Worker.insertMany(workers);
      await Order.insertMany(orders);
      await Transaction.insertMany(transactions);
      await Notification.insertMany(notifications);
      await InventoryLog.insertMany(inventorylogs);
      await AuditLog.insertMany(auditlogs);

      console.log('✅ MongoDB Seeding Complete! Sample catalog, customers, orders, and workers loaded.');
    } catch (err) {
      console.error('❌ Mongoose Seed Error:', err.message);
    }
  } else {
    try {
      writeData('admins', admins);
      writeData('customers', customers);
      writeData('categories', categories);
      writeData('products', products);
      writeData('settings', settings);
      writeData('workers', workers);
      writeData('orders', orders);
      writeData('transactions', transactions);
      writeData('notifications', notifications);
      writeData('inventorylogs', inventorylogs);
      writeData('auditlogs', auditlogs);

      console.log('✅ JSON File Seeding Complete! Sample catalog, customers, orders, and workers written.');
    } catch (err) {
      console.error('❌ JSON Seed Error:', err.message);
    }
  }

  if (global.dbConnected) {
    mongoose.connection.close();
  }
  process.exit();
};

seedData();
