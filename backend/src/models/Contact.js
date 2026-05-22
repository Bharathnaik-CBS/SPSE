const mongoose = require('mongoose');

const phoneNumberSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      default: 'Mobile',
      maxlength: 40,
    },
    number: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedNumber: {
      type: String,
      required: true,
      trim: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const emailSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      default: 'Personal',
      maxlength: 40,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator(value) {
          return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: 'Email must be valid.',
      },
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const avatarSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      trim: true,
      validate: {
        validator(value) {
          return !value || /^https?:\/\/\S+$/i.test(value);
        },
        message: 'Avatar URL must be valid.',
      },
    },
    publicId: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      index: true,
    },
    phoneNumbers: {
      type: [phoneNumberSchema],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: 'At least one phone number is required.',
      },
    },
    emails: {
      type: [emailSchema],
      default: [],
    },
    company: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    avatar: {
      type: avatarSchema,
      default: undefined,
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastViewedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

contactSchema.index({ 'phoneNumbers.number': 1 });
contactSchema.index({ 'phoneNumbers.normalizedNumber': 1 }, { unique: true });
contactSchema.index({ 'emails.email': 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ updatedAt: -1 });

contactSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Contact', contactSchema);
