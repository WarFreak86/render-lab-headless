import type {Route} from './+types/qa-shipping';

// TEMPORARY preview diagnostic. This file is deleted before PR merge.
// Creates disposable carts and retrieves address-specific shipping quotes.
const TEST_VARIANT_ID = 'gid://shopify/ProductVariant/49158024757409';
const TEST_ADDRESSES = [
  {region:'PA mainland', address:{address1:'1400 John F Kennedy Blvd',city:'Philadelphia',provinceCode:'PA',zip:'19107',countryCode:'US'}},
  {region:'AK remote', address:{address1:'120 4th St',city:'Juneau',provinceCode:'AK',zip:'99801',countryCode:'US'}},
  {region:'HI remote', address:{address1:'1525 Bernice St',city:'Honolulu',provinceCode:'HI',zip:'96817',countryCode:'US'}},
] as const;

type StorefrontError = {message: string; code?: string};
type CartDeliveryInfo = {
  deliveryGroups: Array<{
    deliveryAddress: {provinceCode?: string; zip?: string};
    deliveryOptions: Array<{title: string; estimatedCost: {amount: string; currencyCode: string}}>;
  }>;
};
type CreatedCart = {cartCreate:{cart:{id:string}|null; userErrors:StorefrontError[]}};
type AssignedAddress = {
  cartDeliveryAddressesAdd: {
    cart: ({id:string}&CartDeliveryInfo)|null;
    userErrors:StorefrontError[];
    warnings:StorefrontError[];
  };
};

const CREATE = 'mutation TempQaCart($variantId: ID!) { cartCreate(input:{lines:[{merchandiseId:$variantId,quantity:1}]}) {cart{id} userErrors{message code}} }';
const ASSIGN = 'mutation TempQaAddress($cartId:ID!, $addresses:[CartSelectableAddressInput!]!) {cartDeliveryAddressesAdd(cartId:$cartId,addresses:$addresses) {cart{id deliveryGroups{deliveryAddress{provinceCode zip} deliveryOptions{title estimatedCost{amount currencyCode}}}} userErrors{message code} warnings{message code}}}';

export async function action({context,request}:Route.ActionArgs) {
  if(request.method !== 'POST') return new Response('Method not allowed',{status:405});
  const results = [];
  for(const test of TEST_ADDRESSES) {
    try {
      const created = await context.storefront.mutate<CreatedCart>(CREATE,{
        variables:{variantId:TEST_VARIANT_ID},
      });
      if(!created?.cartCreate){
        const diagnosed=created as unknown as {errors?:Array<{message?:string}>;data?:unknown};
        results.push({
          region:test.region,phase:'create-response',
          keys:Object.keys(created??{}),
          messages:diagnosed.errors?.map(e=>e.message).filter(Boolean)??[],
          hasData:Boolean(diagnosed.data),
        });
        continue;
      }
      const cart = created.cartCreate.cart;
      if(!cart || created.cartCreate.userErrors.length){
        results.push({region:test.region,phase:'create',errors:created.cartCreate.userErrors});
        continue;
      }
      const assigned=await context.storefront.mutate<AssignedAddress>(ASSIGN,{
        variables:{cartId:cart.id,addresses:[{
          selected:true,oneTimeUse:true,address:{deliveryAddress:test.address},
        }]},
      });
      const result=assigned.cartDeliveryAddressesAdd;
      results.push({
        region:test.region,phase:'rates',
        userErrors:result.userErrors,warnings:result.warnings,
        groups:(result.cart?.deliveryGroups??[]).map((g)=>({
          province:g.deliveryAddress.provinceCode,
          options:g.deliveryOptions.map(o=>({
            name:o.title,cost:o.estimatedCost.amount,currency:o.estimatedCost.currencyCode,
          })),
        })),
      });
    }catch(error){
      results.push({region:test.region,phase:'exception',
        error:error instanceof Error?error.message:String(error)});
    }
  }
  return Response.json({results},{headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex,nofollow'}});
}
