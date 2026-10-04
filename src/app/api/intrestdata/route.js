import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { jwtVerify } from 'jose';
import Profile from '@/models/profile';
import connectDB from '@/lib/db';
import dbToken from '@/models/tokens';
import { userlog } from '@/models/Registration';
import DiscoverySchema from '@/models/DiscoverySchema';

export async function POST(request) {
  try {
    await connectDB();
    // 1. Extract and Decrypt the Session Cookie (Inline Middleware)
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Session cookie missing. Please log in.' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  
      // 3. Verify and decode the token payload
      const { payload } = await jwtVerify(token, secret);
      const email = payload.email;
       
             const user = await userlog.findOne({
              email: email,
            })
        console.log(user);
    
             const userToken = user.tokenDetails
    
    // Now you have access to user info (e.g., payload.userId)
   

    // 2. Parse and Validate the Incoming Body Data
    const body = await request.json();
    const { interests, height, prompt1, prompt2 } = body;

    if (!interests || !Array.isArray(interests) || interests.length === 0) {
      return NextResponse.json({ error: 'At least one interest is required.' }, { status: 400 });
    }
    if (!height || height < 100 || height > 250) {
      return NextResponse.json({ error: 'A valid height is required.' }, { status: 400 });
    }
    if (!prompt1?.trim() || !prompt2?.trim()) {
      return NextResponse.json({ error: 'Both prompts are required.' }, { status: 400 });
    }

        // const { interests, height, prompt1, prompt2 } = body;

   const existing = await Profile.findOneAndUpdate(
  { email: email }, // 1. Filter
  {
    $set: {
      intrest: interests, // Note: If 'interests' is already an array, wrapping it in brackets [interests] makes it a nested array [[item1, item2]]. Drop the brackets if it's already an array!
      height: height,
      promt1: prompt1,
      promt2: prompt2,
    },
  }, // 2. Update
  { returnDocument: 'after', runValidators: true } // 3. Combined Options
);

    console.log(existing);
    // 3. Save to Database (Placeholder Logic)
    // Example: await db.userProfile.update({ where: { userId }, data: { ... } })
    console.log(`Saving profile data for user :`, { interests, height, prompt1, prompt2 });

    // const savetoken = await dbToken.create({
    //    useId : userId,
    // username: existing.username,
    // setUpprofile:true
    // });

    // console.log(savetoken);

    userToken.isProfileFullyUpdated = true
    await user.save();

    await DiscoverySchema.create({
              email:
                senderProfile.email,
    
              liked: [],
    
              skipped: [],
    
              blocked: [],
    
              reported: [],
    
              likedBy: [],
    
              matches: [],
            });

    // 4. Return Success Response
    return NextResponse.json({ 
      success: true, 
      message: 'Profile step two saved successfully!' 
    });

  } catch (error) {
    console.error("Profile save error:", error.message);
    
    // Catch-all for decryption failures or validation crashes
    if (error.code === 'ERR_JWT_EXPIRED' || error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      return NextResponse.json({ error: 'Invalid or expired session. Please log in again.' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Server error processing request.' }, { status: 500 });
  }
}
