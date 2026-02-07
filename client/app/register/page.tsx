"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    department: "Computer Science",
    enrollmentId: "",
    semester: "",
    employeeId: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      // Prepare request body
      const body: any = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role === "administration" ? "teacher" : form.role,
        department: form.department,
      };

      if (form.role === "student") {
        body.enrollmentId = form.enrollmentId;
        body.semester = Number(form.semester);
      }

      if (form.role === "teacher" || form.role === "administration") {
        body.employeeId = form.employeeId;
      }

      const res = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Registration failed");
      }

      // Save token & user
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem(
        "role",
        form.role === "administration" ? "admin" : data.user.role
      );

      // Redirect
      if (data.user.role === "teacher") {
        router.push("/engagement");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-emerald-600">
            Bodha Setu
          </h1>
          <p className="text-gray-600 mt-2">
            Create your account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">

          {/* Name */}
          <input
            name="name"
            required
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded-lg"
          />

          {/* Email */}
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded-lg"
          />

          {/* Password */}
          <input
            name="password"
            type="password"
            required
            placeholder="Password (min 6 chars)"
            value={form.password}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded-lg"
          />

          {/* Role */}
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded-lg"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="administration">Administration</option>
          </select>

          {/* Department */}
          <input
            name="department"
            placeholder="Department"
            value={form.department}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded-lg"
          />

          {/* Student Fields */}
          {form.role === "student" && (
            <>
              <input
                name="enrollmentId"
                placeholder="Enrollment ID"
                required
                value={form.enrollmentId}
                onChange={handleChange}
                className="w-full border px-4 py-2 rounded-lg"
              />

              <input
                name="semester"
                type="number"
                placeholder="Semester"
                required
                value={form.semester}
                onChange={handleChange}
                className="w-full border px-4 py-2 rounded-lg"
              />
            </>
          )}

          {/* Teacher/Admin Fields */}
          {(form.role === "teacher" ||
            form.role === "administration") && (
            <input
              name="employeeId"
              placeholder="Employee ID"
              required
              value={form.employeeId}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-lg"
            />
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-5 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <span
            onClick={() => router.push("/login")}
            className="text-emerald-600 font-medium cursor-pointer"
          >
            Login
          </span>
        </div>
      </div>
    </div>
  );
}