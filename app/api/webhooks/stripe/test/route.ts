import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: 'Stripe webhook endpoint is working',
    endpoint: '/api/webhooks/stripe',
    timestamp: new Date().toISOString()
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  console.log('Test webhook received:', body)
  
  return NextResponse.json({ 
    received: true,
    message: 'Test webhook processed',
    data: body
  })
}
