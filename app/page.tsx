import OrdersView from './components/OrdersView';
import { fetchOrders } from './lib/api';

// Server component - top level component that fetches initial data
export default async function Home() {
  // Fetch initial data on the server
  const initialData = await fetchOrders().catch(() => null);

  return <OrdersView initialData={initialData} />;
}
