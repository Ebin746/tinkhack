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
      router.push(`/dashboard`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Select Your Role
        </h2>
        <div className="space-y-4">
          {roles.map((role) => (
            <label
              key={role}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all
                ${selectedRole === role 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:bg-blue-50 hover:border-blue-300'}`}
            >
              <input
                type="radio"
                name="role"
                value={role}
                checked={selectedRole === role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-3 text-lg capitalize text-gray-700">{role}</span>
            </label>
          ))}
        </div>
        <button
          onClick={handleSubmit}
          className="w-full mt-6 py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-md 
                     hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!selectedRole}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default RoleSelector;