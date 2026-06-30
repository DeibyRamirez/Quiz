import * as React from "react";

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full border rounded-lg overflow-hidden">
      <table className="w-full text-sm text-left text-gray-700">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="bg-gray-100">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children }: { children: React.ReactNode }) {
  return <tr className="border-b hover:bg-gray-50">{children}</tr>;
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th scope="col" className="px-6 py-3 font-semibold text-gray-900">
      {children}
    </th>
  );
}

export function TableCell({ children }: { children: React.ReactNode }) {
  return <td className="px-6 py-3">{children}</td>;
}
