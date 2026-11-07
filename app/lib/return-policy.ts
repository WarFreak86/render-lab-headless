export const REFUND_POLICY_PATH = '/policies/refund-policy';
export const STANDARD_RETURN_DAYS = 14;
export const REFUND_ISSUE_BUSINESS_DAYS = 5;

// This body is also the draft for Shopify's checkout policy. Publish both copies
// together so customers receive the same terms before and during checkout.
export const REFUND_POLICY = {
  handle: 'refund-policy',
  title: 'Refund Policy',
  body: `
<h2>14-day returns</h2>
<p>You can request a return for a physical product, including made-to-order items, within ${STANDARD_RETURN_DAYS} calendar days of confirmed delivery of that item. We accept both defective and non-defective items. Non-defective items must be new, unused, undamaged, and in suitable original packaging. You buy your own return postage for non-defective items. We charge no restocking fee and do not offer standard exchanges. The same conditions apply to items sold at a discount or marked as is.</p>
<ol>
  <li><strong>Request approval.</strong> Email <a href="mailto:support@render-lab.org">support@render-lab.org</a> with your order number or other proof of purchase and the item you want to return. If you do not have your receipt, contact us for help verifying your purchase. We need to verify your purchase to issue a standard refund. Wait for written authorization before mailing anything.</li>
  <li><strong>Mail the return.</strong> We send the return address and mailing instructions privately in your written authorization. Use only that address. Do not mail your return to Gelato or to the sender address on the package. Pack the item securely and keep your tracking details.</li>
  <li><strong>Inspection and refund.</strong> We inspect the item on arrival. If a non-defective return does not meet the conditions above, we will explain what we found and contact you about the next steps before taking further action. We may decline the refund where permitted by law.</li>
</ol>
<h2>Damaged, defective, or incorrect items</h2>
<p>Please report an issue as soon as possible, ideally within seven calendar days of delivery. We continue to accept these reports within 30 calendar days of delivery. Email <a href="mailto:support@render-lab.org">support@render-lab.org</a> with your order number, a description of the issue, and clear photos of the affected item and, when available, the packaging and shipping label. Keep the packaging while we review your claim.</p>
<p>When we confirm an issue, we offer a replacement at no additional cost. If a replacement is not feasible, we will arrange a refund. We will honor any other remedy required by law. If we need the item back, we will provide return instructions and cover the return shipping cost.</p>
<p>Minor differences in color, brightness, or texture between a screen preview and a correctly produced print are not manufacturing defects. Eligible non-defective prints can still be returned under the standard policy above.</p>
<h2>How refunds are issued</h2>
<p>For an approved non-defective return, we refund the amount paid for the returned item and any applicable tax. Original outbound shipping is not refunded for non-defective returns unless required by law. For an approved refund due to damage, defect, or an incorrect item, we also refund any original shipping charge attributable to the affected item.</p>
<p>We issue approved refunds to the original payment method within ${REFUND_ISSUE_BUSINESS_DAYS} business days after receiving the return, or within ${REFUND_ISSUE_BUSINESS_DAYS} business days of approval if no return is needed. We issue the refund sooner if required by law. Your payment provider may take additional time to post the credit; for payments processed through Shopify Payments, this can take up to 10 business days depending on your bank.</p>
<h2>Order changes and cancellations</h2>
<p>Contact us as soon as possible to change or cancel an order. Production can begin soon after purchase, and we cannot guarantee a change or cancellation once it has started. This does not affect your eligibility for a return after delivery.</p>
<h2>Lost shipments and delivery address issues</h2>
<p>If a shipment appears lost, contact us within 30 days after the estimated delivery date. If tracking shows delivery but you cannot find the package, check the delivery location and contact the carrier, then let us know so we can investigate. We may ask you to confirm the shipping address.</p>
<p>Check your shipping address before ordering and contact us immediately if you find an error. If we need to reproduce or reship an order because of an address error, refusal, or unclaimed delivery, additional production or shipping charges may apply.</p>
<h2>Your consumer rights</h2>
<p>Nothing in this policy limits any consumer right or remedy that cannot legally be waived. This policy applies to orders placed on or after its effective date. If you placed an order before then, the terms in effect at the time of purchase apply, subject to applicable law.</p>
<p>You are entitled to a written copy of this policy on request. To request a copy or ask a question, email <a href="mailto:support@render-lab.org">support@render-lab.org</a>.</p>
`.trim(),
};

const LEGACY_TERMS_EXCLUSION =
  'Because many products are made to order, they are generally not eligible for return or exchange solely because of change of mind, buyer preference, or an incorrect product option selected by the customer.';

export function getReturnTermsParagraph(refundPolicyUrl = REFUND_POLICY_PATH) {
  return `Made-to-order physical products are eligible for standard returns as described in our <a href="${refundPolicyUrl}">Refund Policy</a>. We do not offer standard exchanges.`;
}

// Keep the rest of Shopify's Terms intact. Remove this bridge once the
// corresponding checkout Terms have been updated and verified.
export function alignReturnTerms(body: string) {
  return body.replace(LEGACY_TERMS_EXCLUSION, getReturnTermsParagraph());
}
