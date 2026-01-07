# Order Price Assignment Endpoint

## Overview

This endpoint allows you to assign a price to an order from the rate calculator and automatically adds it to the lane history for future rate analysis.

## Endpoint

**POST** `/orders/{order_id}/assign-price`

## What It Does

1. **Updates Order Quotation**: Creates or updates the order's quotation with the calculated price
2. **Creates Lane History Entry**: If the order has a lane assigned, creates a historical pricing record
3. **Calculates Rate per Mile**: Automatically calculates rate per mile if not provided

## Request

### Path Parameters
- `order_id` (integer, required): The ID of the order to assign a price to

### Request Body

```json
{
  "base_rate": 2500.00,          // Required: The calculated price
  "miles": 500,                   // Optional: Distance in miles
  "rate_per_mile": 5.00,         // Optional: Rate per mile (auto-calculated if not provided)
  "weight_lbs": 45000,           // Optional: Shipment weight
  "commodity": "Electronics",     // Optional: Type of commodity
  "carrier_name": "ABC Trucking", // Optional: Carrier name
  "notes": "From rate calculator" // Optional: Additional notes
}
```

### Required Fields
- `base_rate`: The calculated price/rate for the order

### Optional Fields
- `miles`: Distance in miles (recommended for rate per mile calculation)
- `rate_per_mile`: Rate per mile (calculated automatically if miles provided)
- `weight_lbs`: Weight of the shipment (if not in order.load)
- `commodity`: Type of commodity (if not in order.load)
- `carrier_name`: Name of the carrier
- `notes`: Additional notes about the pricing

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "order_id": 1,
  "lane_id": 5,
  "base_rate": 2500.00,
  "rate_per_mile": 5.00,
  "miles": 500,
  "lane_history_id": 42,
  "message": "Price assigned successfully"
}
```

### Error Responses

#### Order Not Found (404)
```json
{
  "detail": "Order #123 could not be found"
}
```

#### Server Error (500)
```json
{
  "detail": "Failed to assign price: <error message>"
}
```

## Usage Examples

### Using cURL

```bash
curl -X POST "http://localhost:8000/orders/1/assign-price" \
  -H "Content-Type: application/json" \
  -d '{
    "base_rate": 2500.00,
    "miles": 500,
    "rate_per_mile": 5.00,
    "weight_lbs": 45000,
    "commodity": "Electronics",
    "carrier_name": "ABC Trucking",
    "notes": "Calculated from rate calculator"
  }'
```

### Using Python (httpx)

```python
import httpx

async def assign_price_to_order(order_id: int, price_data: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"http://localhost:8000/orders/{order_id}/assign-price",
            json=price_data
        )
        return response.json()

# Usage
price_data = {
    "base_rate": 2500.00,
    "miles": 500,
    "rate_per_mile": 5.00,
    "weight_lbs": 45000,
    "commodity": "Electronics"
}

result = await assign_price_to_order(1, price_data)
print(f"Price assigned! Lane history ID: {result['lane_history_id']}")
```

### Using JavaScript (fetch)

```javascript
async function assignPrice(orderId, priceData) {
  const response = await fetch(`http://localhost:8000/orders/${orderId}/assign-price`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(priceData)
  });
  
  return await response.json();
}

// Usage
const priceData = {
  base_rate: 2500.00,
  miles: 500,
  rate_per_mile: 5.00,
  weight_lbs: 45000,
  commodity: "Electronics"
};

const result = await assignPrice(1, priceData);
console.log(`Price assigned! Lane history ID: ${result.lane_history_id}`);
```

## Integration with Rate Calculator

When using the rate calculator in the frontend:

1. User enters origin, destination, equipment type, etc.
2. Calculator computes the price based on lane history and other factors
3. User clicks "Assign Price" button
4. Frontend calls this endpoint with the calculated price
5. Backend updates the order quotation and creates lane history entry

### Frontend Integration Example

```typescript
// In your rate calculator component
const handleAssignPrice = async () => {
  try {
    const priceData = {
      base_rate: calculatedRate,
      miles: routeDistance,
      rate_per_mile: calculatedRate / routeDistance,
      weight_lbs: orderLoad.weight,
      commodity: orderLoad.commodity,
      notes: "Assigned from rate calculator"
    };
    
    const response = await fetch(
      `/orders/${orderId}/assign-price`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(priceData)
      }
    );
    
    if (response.ok) {
      const result = await response.json();
      toast.success(`Price $${result.base_rate} assigned successfully!`);
      // Refresh order details or redirect
    }
  } catch (error) {
    toast.error("Failed to assign price");
  }
};
```

## Notes

- **Lane Assignment Required**: The order must have a lane assigned (automatically done when order is created) for lane history to be recorded
- **Automatic Calculation**: If `rate_per_mile` is not provided but `miles` is, it will be calculated automatically
- **Load Data**: If `weight_lbs` or `commodity` are not provided, they will be pulled from the order's load if available
- **Lane History**: Creating a lane history entry allows the system to learn from past pricing and improve future rate calculations

## Testing

A test script is available to test the endpoint:

```bash
cd backend
python scripts/test_assign_price.py
```

Make sure to update the `ORDER_ID` variable in the script to an existing order ID.

## Database Changes

This endpoint affects the following tables:

1. **quotations**: Creates or updates the quotation record for the order
2. **lane_history**: Creates a new historical pricing record if order has a lane

## Error Handling

The endpoint uses proper exception handling and will return:
- User-friendly error messages for display
- Technical error details logged for debugging
- Automatic transaction rollback on errors

## Future Enhancements

Possible improvements:
- Batch price assignment for multiple orders
- Price validation against historical averages
- Price approval workflow for rates outside expected ranges
- Integration with external pricing APIs

