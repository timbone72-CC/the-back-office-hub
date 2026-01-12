// ========== FILE: pages/EstimateDetail.jsx ==========

import React, { useState, useEffect } from 'react';
// ... other imports

export default function EstimateDetail() {
  // SECTION 1: DATA FETCHING & INITIALIZATION
  // (Lines 44-71 as seen in the code editor)
  
  // SECTION 2: FORM STATE MANAGEMENT
  const [formData, setFormData] = useState(null);

  // SECTION 3: RECALCULATION & SYNC LOGIC
  useEffect(() => {
    if (estimateId && estimate) {
      // Edit Mode
      const items = estimate.items || [];
      const tax_rate = estimate.tax_rate || 0;

      // SECTION 4: SUBTOTAL & TOTAL CALCULATION
      // Strict recalculation on load to fix any bad data
      const subtotal = items.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const cost = Number(item.unit_cost) || 0;
        item.total = qty * cost;
        return sum + item.total;
      }, 0);

      const total_amount = subtotal + (subtotal * (Number(tax_rate) / 100));

      // SECTION 5: STATE SYNC
      setFormData({
        ...estimate,
        items,
        subtotal,
        tax_rate,
        total_amount,
      });
    }
  }, [estimateId, estimate]);

  // ... remaining component logic
}