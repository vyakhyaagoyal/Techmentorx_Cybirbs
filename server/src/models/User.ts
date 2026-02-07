import mongoose, { Schema, Document } from "mongoose";
import bcryptjs from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "student" | "teacher";
  department: string;
  // Student-specific
  enrollmentId?: string;
  semester?: number;
  subjects?: mongoose.Types.ObjectId[];
  // Teacher-specific
  employeeId?: string;
  teachingSubjects?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      required: true,
      enum: ["student", "teacher"],
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    // Student fields
    enrollmentId: {
      type: String,
      sparse: true,
      unique: true,
    },
    semester: {
      type: Number,
    },
    subjects: [
      {
        type: Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    // Teacher fields
    employeeId: {
      type: String,
      sparse: true,
      unique: true,
    },
    teachingSubjects: [
      {
        type: Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (password: string) {
  return bcryptjs.compare(password, this.password);
};

export const User = mongoose.model<IUser>("User", userSchema);
