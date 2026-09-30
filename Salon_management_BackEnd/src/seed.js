const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Service = require('./models/Service');
const Appointment = require('./models/Appointment');
const Product = require('./models/Product');
const Inventory = require('./models/Inventory');
const Wage = require('./models/Wage');
const Order = require('./models/Order');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon_management');
  console.log('MongoDB Connected for seeding...');
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Promise.all([
      User.deleteMany(),
      Service.deleteMany(),
      Appointment.deleteMany(),
      Product.deleteMany(),
      Inventory.deleteMany(),
      Wage.deleteMany(),
      Order.deleteMany(),
    ]);
    console.log('Cleared existing data');

    // Create Users
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@salon.com',
        password: 'admin123',
        role: 'Admin',
        phone: '9876543210',
      },
      {
        name: 'Marcus Vance',
        email: 'marcus@salon.com',
        password: 'barber123',
        role: 'Barber',
        phone: '9876543211',
        specializations: ['Haircut', 'Beard Styling', 'Hair Coloring'],
        experience: 5,
        bio: 'Expert hairstylist with 5 years of experience',
        workingHours: { start: '09:00', end: '18:00' },
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        commissionRate: 30,
      },
      {
        name: 'Sarah Chen',
        email: 'sarah@salon.com',
        password: 'barber123',
        role: 'Barber',
        phone: '9876543212',
        specializations: ['Haircut', 'Facial', 'Hair Coloring', 'Spa'],
        experience: 3,
        bio: 'Specializes in modern hairstyles and facial treatments',
        workingHours: { start: '10:00', end: '19:00' },
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        commissionRate: 25,
      },
      {
        name: 'David Park',
        email: 'david@salon.com',
        password: 'barber123',
        role: 'Barber',
        phone: '9876543213',
        specializations: ['Beard Styling', 'Haircut', 'Massage'],
        experience: 7,
        bio: 'Master barber specializing in classic and modern beard styles',
        workingHours: { start: '09:00', end: '17:00' },
        workingDays: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        commissionRate: 35,
      },
      {
        name: 'Emily Roberts',
        email: 'emily@salon.com',
        password: 'recep123',
        role: 'Receptionist',
        phone: '9876543214',
      },
      {
        name: 'Alex Mercer',
        email: 'alex@example.com',
        password: 'customer123',
        role: 'Customer',
        phone: '9876543215',
      },
      {
        name: 'Jessica Wilson',
        email: 'jessica@example.com',
        password: 'customer123',
        role: 'Customer',
        phone: '9876543216',
      },
      {
        name: 'Ryan Thompson',
        email: 'ryan@example.com',
        password: 'customer123',
        role: 'Customer',
        phone: '9876543217',
      },
    ]);
    console.log('Users seeded');

    // Create Services
    const services = await Service.create([
      { name: 'Classic Haircut', category: 'Haircut', price: 20, duration: 30, description: 'Traditional haircut with scissor and clipper techniques' },
      { name: 'Premium Haircut', category: 'Haircut', price: 35, duration: 45, description: 'Premium cut with wash, style, and finishing' },
      { name: 'Kids Haircut', category: 'Haircut', price: 15, duration: 20, description: 'Haircut for children under 12' },
      { name: 'Beard Trim', category: 'Beard Styling', price: 15, duration: 20, description: 'Basic beard trim and shape' },
      { name: 'Beard Styling', category: 'Beard Styling', price: 25, duration: 30, description: 'Full beard styling with hot towel treatment' },
      { name: 'Royal Shave', category: 'Beard Styling', price: 30, duration: 35, description: 'Traditional straight razor shave with hot towel' },
      { name: 'Full Hair Coloring', category: 'Hair Coloring', price: 60, duration: 90, description: 'Complete hair color transformation' },
      { name: 'Highlights', category: 'Hair Coloring', price: 45, duration: 60, description: 'Partial or full highlights' },
      { name: 'Basic Facial', category: 'Facial', price: 40, duration: 45, description: 'Cleansing facial with basic skincare routine' },
      { name: 'Premium Facial', category: 'Facial', price: 65, duration: 60, description: 'Deep cleansing facial with premium products' },
      { name: 'Head Massage', category: 'Massage', price: 20, duration: 20, description: 'Relaxing head and scalp massage' },
      { name: 'Full Body Massage', category: 'Spa', price: 80, duration: 60, description: 'Complete relaxation body massage' },
    ]);
    console.log('Services seeded');

    // Create Appointments
    const appointments = await Appointment.create([
      { customer: users[5]._id, barber: users[1]._id, service: services[0]._id, date: '2026-07-15', timeSlot: '10:00', endTime: '10:30', status: 'Confirmed', totalAmount: 20 },
      { customer: users[5]._id, barber: users[2]._id, service: services[4]._id, date: '2026-07-16', timeSlot: '14:30', endTime: '15:00', status: 'Pending', totalAmount: 25 },
      { customer: users[6]._id, barber: users[1]._id, service: services[6]._id, date: '2026-07-15', timeSlot: '11:00', endTime: '12:30', status: 'In Progress', totalAmount: 60 },
      { customer: users[7]._id, barber: users[3]._id, service: services[5]._id, date: '2026-07-14', timeSlot: '09:30', endTime: '10:05', status: 'Completed', totalAmount: 30 },
      { customer: users[6]._id, barber: users[3]._id, service: services[0]._id, date: '2026-07-13', timeSlot: '15:00', endTime: '15:30', status: 'Completed', totalAmount: 20 },
      { customer: users[5]._id, barber: users[1]._id, service: services[10]._id, date: '2026-07-12', timeSlot: '16:00', endTime: '16:20', status: 'Completed', totalAmount: 20 },
      { customer: users[7]._id, barber: users[2]._id, service: services[8]._id, date: '2026-07-11', timeSlot: '10:00', endTime: '10:45', status: 'Completed', totalAmount: 40 },
      { customer: users[6]._id, barber: users[1]._id, service: services[1]._id, date: '2026-07-17', timeSlot: '09:00', endTime: '09:45', status: 'Pending', totalAmount: 35 },
    ]);
    console.log('Appointments seeded');

    // Create Products
    const products = await Product.create([
      { name: 'Premium Hair Wax', category: 'Styling', price: 18.50, brand: 'StylePro', stockQuantity: 45, description: 'Strong hold matte finish wax', rating: 4.5, numReviews: 23 },
      { name: 'Argan Oil Shampoo', category: 'Hair Care', price: 12.99, brand: 'NatureCare', stockQuantity: 60, description: 'Nourishing shampoo with argan oil', rating: 4.2, numReviews: 45 },
      { name: 'Beard Oil - Sandalwood', category: 'Beard Care', price: 15.00, brand: 'BeardKing', stockQuantity: 30, description: 'Premium sandalwood scented beard oil', rating: 4.7, numReviews: 18 },
      { name: 'Hair Gel Extra Hold', category: 'Styling', price: 9.99, brand: 'StylePro', stockQuantity: 80, description: 'Extra strong hold hair gel', rating: 3.8, numReviews: 52 },
      { name: 'Moisturizing Face Cream', category: 'Skin Care', price: 22.00, brand: 'DermaFresh', stockQuantity: 25, description: 'Daily moisturizing cream for all skin types', rating: 4.4, numReviews: 31 },
      { name: 'Anti-Dandruff Shampoo', category: 'Hair Care', price: 14.50, brand: 'MediHair', stockQuantity: 40, description: 'Clinically proven anti-dandruff formula', rating: 4.1, numReviews: 67 },
      { name: 'Hair Color - Jet Black', category: 'Hair Care', price: 8.99, brand: 'ColorMaster', stockQuantity: 55, description: 'Permanent jet black hair color', rating: 4.0, numReviews: 29 },
      { name: 'Professional Scissors', category: 'Tools', price: 45.00, brand: 'CutPro', stockQuantity: 10, description: 'Japanese steel professional cutting scissors', rating: 4.9, numReviews: 12 },
      { name: 'Pomade Classic', category: 'Styling', price: 16.00, brand: 'RetroStyle', stockQuantity: 35, description: 'Water-based classic pomade with medium hold', rating: 4.3, numReviews: 41 },
      { name: 'Aftershave Balm', category: 'Skin Care', price: 11.50, brand: 'DermaFresh', stockQuantity: 50, description: 'Soothing aftershave balm with aloe vera', rating: 4.6, numReviews: 38 },
    ]);
    console.log('Products seeded');

    // Create Inventory
    await Inventory.create([
      { itemName: 'Professional Shampoo 1L', category: 'Shampoo', currentStock: 25, minimumStock: 10, unit: 'bottles', costPerUnit: 8.50, supplier: { name: 'SalonSupply Co', contact: '1234567890', email: 'supply@salon.com' } },
      { itemName: 'Hair Wax Bulk', category: 'Hair Wax', currentStock: 5, minimumStock: 15, unit: 'tubes', costPerUnit: 6.00, supplier: { name: 'StylePro Wholesale', contact: '1234567891', email: 'wholesale@stylepro.com' } },
      { itemName: 'Professional Hair Color Kit', category: 'Hair Color', currentStock: 8, minimumStock: 10, unit: 'packets', costPerUnit: 12.00, supplier: { name: 'ColorMaster Direct', contact: '1234567892', email: 'direct@colormaster.com' } },
      { itemName: 'Face Cream Professional', category: 'Face Cream', currentStock: 20, minimumStock: 8, unit: 'tubes', costPerUnit: 15.00, supplier: { name: 'DermaFresh Pro', contact: '1234567893', email: 'pro@dermafresh.com' } },
      { itemName: 'Styling Gel 500ml', category: 'Gel', currentStock: 30, minimumStock: 12, unit: 'bottles', costPerUnit: 4.50, supplier: { name: 'SalonSupply Co', contact: '1234567890', email: 'supply@salon.com' } },
      { itemName: 'Hair Oil Treatment', category: 'Oil', currentStock: 3, minimumStock: 10, unit: 'bottles', costPerUnit: 7.00, supplier: { name: 'NatureCare B2B', contact: '1234567894', email: 'b2b@naturecare.com' } },
      { itemName: 'Disposable Razors Pack', category: 'Razor', currentStock: 50, minimumStock: 20, unit: 'packets', costPerUnit: 3.00, supplier: { name: 'BladeSupply', contact: '1234567895', email: 'orders@bladesupply.com' } },
      { itemName: 'Cotton Towels', category: 'Towel', currentStock: 40, minimumStock: 15, unit: 'pieces', costPerUnit: 5.00, supplier: { name: 'TextilePro', contact: '1234567896', email: 'sales@textilepro.com' } },
      { itemName: 'Cutting Cape', category: 'Cape', currentStock: 12, minimumStock: 5, unit: 'pieces', costPerUnit: 10.00, supplier: { name: 'SalonSupply Co', contact: '1234567890', email: 'supply@salon.com' } },
      { itemName: 'Professional Scissors Set', category: 'Scissors', currentStock: 2, minimumStock: 4, unit: 'pieces', costPerUnit: 35.00, supplier: { name: 'CutPro Direct', contact: '1234567897', email: 'direct@cutpro.com' } },
    ]);
    console.log('Inventory seeded');

    // Create Wage records
    await Wage.create([
      { barber: users[1]._id, service: services[0]._id, date: '2026-07-12', serviceAmount: 20, commissionRate: 30, commissionEarned: 6, tips: 3, totalEarning: 9, month: 7, year: 2026, status: 'Paid' },
      { barber: users[1]._id, service: services[6]._id, date: '2026-07-11', serviceAmount: 60, commissionRate: 30, commissionEarned: 18, tips: 5, totalEarning: 23, month: 7, year: 2026, status: 'Paid' },
      { barber: users[3]._id, service: services[5]._id, date: '2026-07-14', serviceAmount: 30, commissionRate: 35, commissionEarned: 10.5, tips: 5, totalEarning: 15.5, month: 7, year: 2026, status: 'Pending' },
      { barber: users[3]._id, service: services[0]._id, date: '2026-07-13', serviceAmount: 20, commissionRate: 35, commissionEarned: 7, tips: 2, totalEarning: 9, month: 7, year: 2026, status: 'Paid' },
      { barber: users[2]._id, service: services[8]._id, date: '2026-07-11', serviceAmount: 40, commissionRate: 25, commissionEarned: 10, tips: 4, totalEarning: 14, month: 7, year: 2026, status: 'Paid' },
      { barber: users[1]._id, service: services[1]._id, date: '2026-06-28', serviceAmount: 35, commissionRate: 30, commissionEarned: 10.5, tips: 5, totalEarning: 15.5, month: 6, year: 2026, status: 'Paid' },
      { barber: users[2]._id, service: services[9]._id, date: '2026-06-25', serviceAmount: 65, commissionRate: 25, commissionEarned: 16.25, tips: 8, totalEarning: 24.25, month: 6, year: 2026, status: 'Paid' },
    ]);
    console.log('Wages seeded');

    console.log('\n--- Seed Complete ---');
    console.log('\nLogin Credentials:');
    console.log('Admin:        admin@salon.com / admin123');
    console.log('Barber:       marcus@salon.com / barber123');
    console.log('Barber:       sarah@salon.com / barber123');
    console.log('Barber:       david@salon.com / barber123');
    console.log('Receptionist: emily@salon.com / recep123');
    console.log('Customer:     alex@example.com / customer123');
    console.log('Customer:     jessica@example.com / customer123');
    console.log('Customer:     ryan@example.com / customer123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
