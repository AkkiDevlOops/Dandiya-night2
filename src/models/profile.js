import mongoose from "mongoose";

// ======================================================
// PROMPT SCHEMA
// ======================================================

const PromptSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      default: "",
      trim: true,
    },

    answer: {
      type: String,
      default: "",
      trim: true,
    },

    type: {
      type: String,
      enum: ["text", "voice", "video", "poll"],
      default: "text",
    },
  },
  {
    _id: true,
  }
);


// ======================================================
// PROFILE SCHEMA
// ======================================================

const UserProfile = new mongoose.Schema(
  {
    id: {
      type: String,
    },

    username: {
      type: String,
      required: true,
      trim: true,
    },

    college: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    branch: {
      type: String,
      required: true,
    },

    // Keep semester fixed from profile creation
    semester: {
      type: String,
      required: true,
    },

    // ==================================================
    // DATE OF BIRTH
    // ==================================================

    dateOfBirth: {
      type: Date,
      default: null,
    },

    // ==================================================
    // INTERESTS
    // ==================================================

    interests: {
      type: [String],
      default: [],
    },

    // ==================================================
    // PROMPTS
    // Maximum 6 should be enforced by backend
    // ==================================================

    prompts: {
      type: [PromptSchema],
      default: [],
      validate: {
        validator: function (value) {
          return value.length <= 6;
        },
        message: "Maximum 6 prompts are allowed.",
      },
    },

    // ==================================================
    // HEIGHT
    // ==================================================

    height: {
      type: String,
      default: "",
    },

    // ==================================================
    // ABOUT / INTRO
    // ==================================================

    intro: {
      type: String,
      default: "",
      maxlength: 500,
    },

    // ==================================================
    // IMAGES
    // ==================================================

    images: {
      type: [String],
      default: [],
    },

    imageHashes: {
      type: [String],
      default: [],
    },

    // ==================================================
    // CREATED
    // ==================================================

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);


const Profile =
  mongoose.models.Profile ||
  mongoose.model("Profile", UserProfile);

export default Profile;