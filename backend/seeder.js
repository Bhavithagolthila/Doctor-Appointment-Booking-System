const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Doctor = require('./models/Doctor');

// Image gender map (verified by inspection):
// MALE:   doc1, doc3, doc4, doc6, doc7, doc8, doc10, doc12, doc13, doc14
// FEMALE: doc2, doc5, doc9, doc11

const doctors = [
  // Male doctors → male photos
  { name: 'Dr. Arjun Sharma',   speciality: 'General Physician',  degree: 'MBBS, MD',  experience: '4 Years',  fee: 500,  available: true,  image: '/doc1.png',  location: 'Mumbai',    rating: 4.5, about: 'Dr. Arjun Sharma is a dedicated General Physician with 4 years of clinical experience in Mumbai. Specializes in preventive care, lifestyle diseases, fever, diabetes, and hypertension management. Known for his patient-first approach and clear communication with families.' },
  { name: 'Dr. Rohit Verma',    speciality: 'Dermatologist',      degree: 'MBBS, DVD', experience: '3 Years',  fee: 600,  available: true,  image: '/doc3.png',  location: 'Hyderabad', rating: 4.4, about: 'Dr. Rohit Verma is a certified Dermatologist in Hyderabad with 3 years of focused practice in skin, hair, and nail disorders. He offers advanced treatments for acne, psoriasis, eczema, vitiligo, and cosmetic procedures.' },
  { name: 'Dr. Alok Kumar',   speciality: 'Pediatricians',      degree: 'MBBS, DCH', experience: '5 Years',  fee: 500,  available: true,  image: '/doc4.png',  location: 'Mumbai',    rating: 4.5, about: 'Dr. Alok Kumar is a compassionate Pediatrician in Mumbai with 5 years of experience. He cares for children from newborns to adolescents, focusing on child development, vaccinations, nutrition, and common childhood illnesses.' },
  { name: 'Dr. Vikram Reddy',   speciality: 'Neurologist',        degree: 'MBBS, DM',  experience: '10 Years', fee: 1000, available: true,  image: '/doc6.png',  location: 'Delhi',     rating: 4.8, about: 'Dr. Vikram Reddy is a leading Neurologist in Delhi with 10 years of expertise. He specializes in epilepsy, migraine, stroke management, and Parkinson\'s disease. His research contributions make him one of the top neurologists in India.' },
  { name: 'Dr. Ramesh Pillai',  speciality: 'Gastroenterologist', degree: 'MBBS, DM',  experience: '6 Years',  fee: 800,  available: true,  image: '/doc7.png',  location: 'Chennai',   rating: 4.6, about: 'Dr. Ramesh Pillai is a skilled Gastroenterologist in Chennai with 6 years of clinical experience. He specializes in endoscopy, colonoscopy, liver disease, IBS, GERD, and gastrointestinal oncology.' },

  // Female doctors → female photos
  { name: 'Dr. Priya Mehta',    speciality: 'General Physician',  degree: 'MBBS, MD',  experience: '6 Years',  fee: 500,  available: true,  image: '/doc2.png',  location: 'Delhi',     rating: 4.6, about: 'Dr. Priya Mehta is an experienced General Physician based in Delhi with 6 years of practice. She focuses on early diagnosis, chronic disease management, and preventive healthcare, ensuring every patient receives personalized attention and quality care.' },
  { name: 'Dr. Sunita Rao',     speciality: 'Gynecologist',       degree: 'MBBS, DGO', experience: '8 Years',  fee: 700,  available: true,  image: '/doc5.png',  location: 'Bangalore', rating: 4.7, about: 'Dr. Sunita Rao is a highly experienced Gynecologist with 8 years of practice in Bangalore. She specializes in high-risk pregnancies, PCOS, endometriosis, and women\'s reproductive health, trusted by thousands of women.' },
  { name: 'Dr. Kavitha Nair',   speciality: 'Gynecologist',       degree: 'MBBS, MS',  experience: '5 Years',  fee: 700,  available: true,  image: '/doc9.png',  location: 'Chennai',   rating: 4.5, about: 'Dr. Kavitha Nair is a skilled Gynecologist in Chennai with 5 years of experience in maternal care, fertility treatments, and routine gynecological procedures. Her gentle approach makes patients feel comfortable and safe.' },
  { name: 'Dr. Anjali Singh',   speciality: 'Dermatologist',      degree: 'MBBS, MD',  experience: '7 Years',  fee: 600,  available: true,  image: '/doc11.png', location: 'Pune',      rating: 4.6, about: 'Dr. Anjali Singh has 7 years of expertise in clinical and cosmetic dermatology in Pune. She is known for detailed diagnosis of skin conditions and offers laser treatments, hair restoration therapies, and skin aging solutions.' },
  { name: 'Dr. Gaurav Iyer',     speciality: 'Pediatricians',      degree: 'MBBS, MD',  experience: '4 Years',  fee: 500,  available: true,  image: '/doc8.png',  location: 'Kolkata',   rating: 4.5, about: 'Dr. Gaurav Iyer is a dedicated Pediatrician in Kolkata with 4 years of practice. He specializes in neonatal care, child nutrition, immunization schedules, and managing respiratory and digestive conditions in children.' },
  { name: 'Dr. Sharma Gupta',  speciality: 'Neurologist',        degree: 'MBBS, DM',  experience: '8 Years',  fee: 1000, available: true,  image: '/doc10.png', location: 'Bangalore', rating: 4.7, about: 'Dr. Sharma Gupta is an accomplished Neurologist in Bangalore with 8 years of experience diagnosing and treating headaches, dementia, multiple sclerosis, and peripheral nerve disorders with a compassionate patient-centered approach.' },
  { name: 'Dr. Raj Desai',    speciality: 'Gastroenterologist', degree: 'MBBS, MD',  experience: '7 Years',  fee: 800,  available: true,  image: '/doc12.png', location: 'Hyderabad', rating: 4.6, about: 'Dr. Raj Desai has 7 years of expertise in gastroenterology in Hyderabad. He manages complex digestive disorders, fatty liver disease, and inflammatory bowel conditions with a focus on preventive digestive health.' },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB connected');
  await Doctor.deleteMany({});
  await User.deleteMany({ role: 'admin' });
  await Doctor.insertMany(doctors);
  console.log(`✅ ${doctors.length} doctors seeded with Indian names, ₹ fees, real images`);
  // Pass plain password — the User model's pre('save') hook will hash it once
  await User.create({ name: 'Admin', email: 'admin@medicare.com', password: 'admin123', role: 'admin' });
  console.log('✅ Admin seeded — admin@medicare.com / admin123');
  await mongoose.disconnect();
  console.log('✅ Done!');
}
seed().catch(err => { console.error(err); process.exit(1); });
