import Link from "next/link";
import ProductClient from "./ProductClient";

export default async function ProductDetail(props: { searchParams: Promise<{ id?: string }> }) {
  const searchParams = await props.searchParams;
  const productId = searchParams?.id;

  let product: any = null;
  if (productId) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/products/${productId}`, { cache: 'no-store' });
      if (res.ok) product = await res.json();
    } catch(e) { console.error(e) }
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800">Product not found 👗</h2>
        <Link href="/category" className="mt-4 px-6 py-2 bg-black text-white rounded-full">Continue Shopping</Link>
      </div>
    );
  }

  return <ProductClient product={product} />;
}
