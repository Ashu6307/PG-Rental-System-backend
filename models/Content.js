import mongoose from 'mongoose';

const ContentSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true }, // e.g. 'about', 'home', 'contact'
  hero: {
    title: String,
    subtitle: String,
    description: [String],
  },
  whyChooseUs: [
    {
      icon: String,
      title: String,
      description: String,
    },
  ],
  mission: {
    title: String,
    subtitle: String,
    description: String,
  },
  vision: {
    title: String,
    subtitle: String,
    description: String,
  },
  values: [
    {
      title: String,
      description: String,
      icon: String,
      color: {
        accent: String,
        background: String,
        text: String
      },
      benefits: [String],
      metrics: {
        satisfactionRate: Number,
        impactScore: Number
      },
      category: String,
      tags: [String]
    }
  ],
  contactInfo: {
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String
    },
    phone: mongoose.Schema.Types.Mixed, // string or { primary, whatsapp }
    email: String,
    whatsapp: String,
    workingHours: {
      start: String,
      end: String
    },
    additional: String
  },
  offices: [
    {
      name: String,
      address: {
        street: String,
        city: String,
        state: String,
        pincode: String
      },
      contact: {
        phone: mongoose.Schema.Types.Mixed
      },
      services: mongoose.Schema.Types.Mixed,
      workingHours: {
        start: String,
        end: String
      }
    }
  ],
  faq: [
    {
      question: String,
      answer: String
    }
  ],
  team: [
    {
      name: String,
      position: String,
      avatar: String,
      bio: String,
      gradientColors: String,
      social: {
        linkedin: String,
        email: String
      }
    }
  ],
  for: { type: String, enum: ['public', 'user', 'owner'], default: 'public' },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Content', ContentSchema);