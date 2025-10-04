"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  external?: boolean;
}

interface SidebarProps {
  title: string;
  subtitle?: string;
  links: SidebarLink[];
  userName: string;
  logoutButton: React.ReactNode;
  topRightContent?: React.ReactNode;
}

export default function Sidebar({
  title,
  subtitle,
  links,
  userName,
  logoutButton,
  topRightContent,
}: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Sidebar para desktop */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex-1 px-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(link.href)
                    ? "bg-blue-100 text-blue-900"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    isActive(link.href) ? "text-blue-900" : "text-gray-500"
                  }`}
                >
                  {link.icon}
                </span>
                {link.label}
                {link.external && (
                  <svg
                    className="ml-auto h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                )}
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <div className="mt-2">{logoutButton}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Overlay background */}
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sidebar panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              {/* Header */}
              <div className="flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                )}
              </div>

              {/* Navigation */}
              <nav className="mt-8 px-3 space-y-1">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(link.href)
                        ? "bg-blue-100 text-blue-900"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <span
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        isActive(link.href) ? "text-blue-900" : "text-gray-500"
                      }`}
                    >
                      {link.icon}
                    </span>
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* User section */}
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center w-full">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {userName}
                  </p>
                  <div className="mt-2">{logoutButton}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top right content for mobile */}
      {topRightContent && (
        <div className="lg:hidden fixed top-16 right-4 z-30">
          {topRightContent}
        </div>
      )}
    </>
  );
}
