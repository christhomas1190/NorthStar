import { useState } from "react";

export default function UserForm({ onSubmit, roles = ["Admin","Teacher","Counselor","Viewer"] }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    fullName: "",
    role: roles[0] || "Viewer",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(form);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium">Full name</label>
        <input
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          className="mt-1 w-full rounded border px-3 py-2"
          placeholder="Christian Thomas"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Username</label>
        <input
          name="username"
          value={form.username}
          onChange={handleChange}
          className="mt-1 w-full rounded border px-3 py-2"
          placeholder="CThomas"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Password</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          className="mt-1 w-full rounded border px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Role</label>
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="mt-1 w-full rounded border px-3 py-2"
        >
          {roles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Create user
      </button>
    </form>
  );
}