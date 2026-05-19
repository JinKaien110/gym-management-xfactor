import cron from 'node-cron';
import { connectDB } from '../config/db.js';
// import sendEmail from '../services/brevoService.js';

cron.schedule('0 9 * * *', async () => {

try {

    const { db } = await connectDB();

    // 3 days before expiration
    const target = new Date();
    target.setDate(target.getDate() + 3);


    // ----------------------------------
    // Find expiring daily passes
    // ----------------------------------
    const expiringPasses = await db.collection('clients_pass')
    .find({
        end_date: { $lte: target },
        status: 'active',
        reminder_sent: { $ne: true }
    })
    .toArray();



    // ----------------------------------
    // Find expiring memberships
    // ----------------------------------
    const expiringMemberships = await db.collection('memberships')
    .find({
        end_date: { $lte: target },
        status: 'active',
        reminder_sent: { $ne: true }
    })
    .toArray();



    // ----------------------------------
    // Collect all member IDs
    // ----------------------------------
    const ids = [
      ...expiringPasses.map(x => x.client_id),
      ...expiringMemberships.map(x => x.client_id)
    ];


    if(!ids.length){
        console.log('No expiring clients found');
        return;
    }



    // Remove duplicate ids
    const uniqueIds = [...new Set(
      ids.map(id => String(id))
    )];



    // ----------------------------------
    // Fetch all members once
    // ----------------------------------
    const clients = await db.collection('clients')
    .find({
       _id: {
         $in: uniqueIds
       }
    })
    .toArray();



    // ----------------------------------
    // Build quick lookup map
    // key = member_id
    // value = member document
    // ----------------------------------
    const memberMap = new Map(
      clients.map(client => [
        String(client._id),
        client
      ])
    );



    // ==================================
    // DAILY PASS REMINDERS
    // ==================================
    for(const pass of expiringPasses){

       const client = memberMap.get(
          String(pass.client_id)
       );

       if(!client?.email) continue;

        const emailHtml = emailDailyPassReminder(client, pass);

        await sendEmail({
            to: client.email,
            subject: 'Daily Pass Expiration Notice - 3 Days Remaining',
            html: emailHtml
        });

       await db.collection('clients_pass').updateOne(
         {
            _id: pass._id
         },
         {
           $set:{
              reminder_sent:true,
              reminder_sent_at:new Date()
           }
         }
       );

    }



    // ==================================
    // MEMBERSHIP REMINDERS
    // ==================================
    for(const membership of expiringMemberships){

       const client = memberMap.get(
          String(membership.client_id)
       );

       if(!client?.email) continue;

        const emailHtml = emailMembershipReminder(client, membership);

        await sendEmail({
            to: client.email,
            subject: 'Membership Expiration Notice - 3 Days Remaining',
            html: emailHtml
        });
            
       await db.collection('memberships').updateOne(
         {
           _id: membership._id
         },
         {
           $set:{
              reminder_sent:true,
              reminder_sent_at:new Date()
           }
         }
       );

    }

    console.log('Expiration reminders completed');


}
catch(error){
   console.error(
      'Cron job failed:',
      error
   );
}

});