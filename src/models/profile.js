import mongoose from "mongoose";

const UserProfile = new mongoose.Schema({
  id:{
    type : String
  },

  username: {
    type: String,
    required: true,
  },

  college: {
    type: String,
    required: true,
  },

  gender: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
  },

  branch: {
    type: String,
    required: true,
  },

   intrest: [{
    type: String,
  }],

   height: {
    type: String,
  },

   promt1: {
    type: String,
  },

   promt2: {
    type: String,
  },

  semester: {
    type: String,
    required: true,
  },

 images: {
  type: [String],
  default: [],
},

imageHashes: {
  type: [String],
  default: [],
},

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Profile =
  mongoose.models.Profile ||
  mongoose.model("Profile", UserProfile);

export default Profile;