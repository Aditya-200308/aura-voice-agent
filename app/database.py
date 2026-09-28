"""
Mock Order Database for Aura Skincare D2C Voice CX Agent.
Contains specified sample orders and operations with policy enforcement.
"""

from typing import Dict, Any, Optional
import re

MOCK_ORDERS: Dict[str, Dict[str, Any]] = {
    "ORD-101": {
        "order_id": "ORD-101",
        "customer": "Priya Sharma",
        "product": "Vitamin C Serum (30ml)",
        "value": 699,
        "currency": "INR",
        "status": "Out for Delivery",
        "tracking_partner": "BlueDart",
        "tracking_number": "BD-982103",
        "expected_delivery": "by 6 PM today",
        "notes": "Out for delivery via BlueDart. Expected by 6 PM today",
        "can_cancel": False,
        "cancellation_reason": "Order is already Out for Delivery. Per Aura Skincare policy, orders can only be cancelled while in 'Processing' status. Customers may refuse delivery at the doorstep."
    },
    "ORD-102": {
        "order_id": "ORD-102",
        "customer": "Rahul Verma",
        "product": "Hydrating Sunscreen SPF 50",
        "value": 499,
        "currency": "INR",
        "status": "Delivered",
        "tracking_partner": "Delhivery",
        "tracking_number": "DL-441029",
        "delivered_time": "14 days ago",
        "notes": "Delivered 14 days ago via Delhivery",
        "can_cancel": False,
        "cancellation_reason": "Order was already delivered 14 days ago. Returns are only accepted within 7 days of delivery for unopened products."
    },
    "ORD-103": {
        "order_id": "ORD-103",
        "customer": "Ananya Patel",
        "product": "Green Tea Face Wash + Toner",
        "value": 850,
        "currency": "INR",
        "status": "Processing",
        "tracking_partner": None,
        "tracking_number": None,
        "notes": "Ordered 3 hours ago. Eligible for cancellation",
        "can_cancel": True,
        "cancellation_reason": None
    }
}

# Multi-Brand Directory (House of Aura Brands)
AURA_BRANDS = {
    "Aura Skincare": {
        "tagline": "Pure Organic Botanicals & Herbal Infusions",
        "hero_products": ["Vitamin C Glow Serum", "Green Tea Face Wash", "Hydrating Sunscreen SPF 50"],
        "philosophy": "100% vegan, cruelty-free, gentle on sensitive skin."
    },
    "Aura Derma": {
        "tagline": "Clinical Active Formulations",
        "hero_products": ["Niacinamide 10% Blemish Serum", "Salicylic Acid 2% Exfoliator"],
        "philosophy": "Science-backed dermatological actives for persistent acne and texture."
    },
    "Aura Men": {
        "tagline": "Men's Active Grooming & Pollution Defense",
        "hero_products": ["Volcanic Charcoal Deep Cleanse", "Cedarwood Beard Growth Elixir"],
        "philosophy": "Formulated specifically for tougher, oilier skin exposed to urban pollution."
    }
}

# Pincode Serviceability Directory
PINCODE_SERVICEABILITY = {
    "560001": {"city": "Bengaluru", "state": "Karnataka", "eta": "2 to 3 business days", "partner": "BlueDart", "cod_available": True},
    "110001": {"city": "New Delhi", "state": "Delhi", "eta": "2 business days", "partner": "BlueDart", "cod_available": True},
    "400001": {"city": "Mumbai", "state": "Maharashtra", "eta": "2 business days", "partner": "BlueDart", "cod_available": True},
    "700001": {"city": "Kolkata", "state": "West Bengal", "eta": "3 business days", "partner": "Delhivery", "cod_available": True},
    "600001": {"city": "Chennai", "state": "Tamil Nadu", "eta": "2 to 3 business days", "partner": "BlueDart", "cod_available": True},
    "500001": {"city": "Hyderabad", "state": "Telangana", "eta": "2 to 3 business days", "partner": "BlueDart", "cod_available": True},
    "411001": {"city": "Pune", "state": "Maharashtra", "eta": "2 business days", "partner": "Delhivery", "cod_available": True},
    "380001": {"city": "Ahmedabad", "state": "Gujarat", "eta": "3 business days", "partner": "Delhivery", "cod_available": True}
}

# Product Recommendation Catalog
RECOMMENDATION_CATALOG = {
    "dry": {
        "product": "Hydrating Sunscreen SPF 50 & Hyaluronic Rose Mist",
        "reason": "Replenishes skin barrier moisture and prevents trans-epidermal water loss."
    },
    "oily": {
        "product": "Green Tea Face Wash + Purifying Toner",
        "reason": "Balances natural sebum production and gently cleanses pores without drying."
    },
    "acne": {
        "product": "Aura Derma Salicylic Acid 2% Gentle Exfoliator",
        "reason": "Unclogs congested pores and reduces active blemishes and inflammation."
    },
    "pigmentation": {
        "product": "Vitamin C Radiance Serum 30ml",
        "reason": "Fades dark spots, evens skin tone, and boosts natural collagen."
    },
    "men": {
        "product": "Aura Men Charcoal Face Wash + Beard Oil",
        "reason": "Detoxifies urban grime and softens beard hair with natural jojoba."
    }
}


def normalize_order_id(raw_id: str) -> Optional[str]:
    """
    Normalizes variations of order IDs like 'ord 101', 'ord-101', '101'
    to standard 'ORD-101'.
    """
    if not raw_id:
        return None
    cleaned = raw_id.strip().upper()
    
    # Direct match
    if cleaned in MOCK_ORDERS:
        return cleaned
    
    # Handle 'ORD 101' or 'ORD101'
    match = re.search(r'(?:ORD\s*[-_ ]*)?(\d{3})', cleaned)
    if match:
        formatted = f"ORD-{match.group(1)}"
        if formatted in MOCK_ORDERS:
            return formatted
            
    return cleaned  # Return as-is if no known pattern matches


def get_order_by_id(order_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves an order by its ID, with normalization."""
    normalized_id = normalize_order_id(order_id)
    return MOCK_ORDERS.get(normalized_id)


def cancel_order_by_id(order_id: str) -> Dict[str, Any]:
    """
    Attempts to cancel an order based on Aura Skincare's cancellation policy:
    Only orders with status 'Processing' can be cancelled.
    """
    normalized_id = normalize_order_id(order_id)
    order = MOCK_ORDERS.get(normalized_id)
    
    if not order:
        return {
            "success": False,
            "error": "ORDER_NOT_FOUND",
            "message": f"No order found with ID '{order_id}'. Please verify the order number."
        }
        
    if order["status"] == "Processing":
        order["status"] = "Cancelled"
        order["notes"] = "Cancelled by customer request"
        order["can_cancel"] = False
        return {
            "success": True,
            "order_id": normalized_id,
            "customer": order["customer"],
            "status": "Cancelled",
            "message": f"Order {normalized_id} for {order['product']} has been successfully cancelled."
        }
    else:
        return {
            "success": False,
            "error": "NOT_ELIGIBLE_FOR_CANCELLATION",
            "order_id": normalized_id,
            "current_status": order["status"],
            "message": order["cancellation_reason"] or f"Orders with status '{order['status']}' cannot be cancelled."
        }


def get_all_orders_summary() -> list:
    """Returns a list of all mock orders for evaluator reference UI."""
    return [
        {
            "order_id": v["order_id"],
            "customer": v["customer"],
            "product": v["product"],
            "value": f"₹{v['value']}",
            "status": v["status"],
            "notes": v["notes"]
        }
        for v in MOCK_ORDERS.values()
    ]
