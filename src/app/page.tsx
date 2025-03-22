"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const roles = ['enthusiast', 'coder', 'architect', 'outsider'];

interface RoleSelectorProps {
  onSelect?: (role: string) => void; // Make it optional if needed
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ onSelect }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const router = useRouter();

  // Load saved role from localStorage on component mount
  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      setSelectedRole(savedRole);
    }
  }, []);

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    localStorage.setItem('userRole', role);
  };

  const handleSubmit = () => {
    if (selectedRole) {
      if (onSelect) {
        onSelect(selectedRole);
      }
      localStorage.setItem('userRole', selectedRole);
      // Redirect to dashboard with the selected role as a dynamic route parameter
      router.push(`/dashboard`);
    }
  };

  return (
    <div className="p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-bold mb-4">Select Your Role</h2>
      <div className="space-y-2 mb-4">
        {roles.map((role) => (
          <label
            key={role}
            className="flex items-center space-x-2 p-2 rounded-md cursor-pointer"
          >
            <input
              type="radio"
              name="role"
              value={role}
              checked={selectedRole === role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-4 h-4 text-blue-500 focus:ring-blue-500"
            />
            <span className="capitalize">{role}</span>
          </label>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Submit
      </button>
    </div>
  );
};

export default RoleSelector;
