export default function AddProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-gray-100 z-50 overflow-auto">
      <div className="h-full">
        {children}
      </div>
    </div>
  );
}
