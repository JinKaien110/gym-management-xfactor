import { connectDB } from "../config/db.js";




class AdminDashboardModel {

    /**
     * 
     * @param {*} filter 
     * @param {*} page 
     * @param {*} limit 
     * @param {*} skip 
     * @returns 
     * 
     * ADMIN DASHBOARD
     */
    async dashboard() {
        const { db } = await connectDB();

        const totalclients = await db.collection("clients").countDocuments();
        const activemembership = await db.collection("memberships").countDocuments({ status: "active" });
        const revenue = await db.collection("payments").aggregate([
            { $match: { status: "PAID" } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    totalRevenue: { $sum: "$amount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]).toArray();

        const [
            membershipPending,
            discountPending
        ] = await Promise.all([
            db.collection("memberships_request").countDocuments({ status: "pending" }),
            db.collection("discount_requests").countDocuments({ status: "pending" })
        ]);

        const totalPending = membershipPending + discountPending;

        return {
            totalclients,
            activemembership,
            revenue,
            totalPending
        };
    }

    async recentActivities() {
        const { db } = await connectDB();

        const [items, total] = await Promise.all([
            db.collection("audit_logs")
            .find()
            .sort({ createdAt: -1 })     
            .limit(50)
            .toArray(),

            db.collection("audit_logs").countDocuments()
        ]);

        return {
            total,
            items
        };
    }

    async todaysClasses() {
        const { db } = await connectDB();

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const result = await db.collection("class_schedule")
            .aggregate([
                {
                    $match: {
                        createdAt: { $gte: startOfDay, $lte: endOfDay }
                    }
                },
                {
                    $lookup: {
                        from: "classes",
                        localField: "class_id",
                        foreignField: "_id",
                        as: "class"
                    }
                }, 
                { $unwind: "$class" },
                 {
                $lookup: {
                    from: "bookings",
                    let: { scheduleId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$schedule_id", "$$scheduleId"] },
                                status: { $ne: "cancelled" }
                            }
                        }
                    ],
                    as: "bookings"
                }
            },

            {
                $addFields: {
                    joined_count: { $size: "$bookings" },
                    available_slots: {
                        $subtract: ["$capacity", { $size: "$bookings" }]
                    }
                }
            },
                { $sort: { createdAt: -1 } },
                { $limit: 5 },
                {
                    $project: {
                        name: "$class.name",
                        createdAt: 1,
                        capacity: 1,
                        class_id: "$class._id",
                        schedule_id: "$_id",
                        joined_count: 1,
                        available_slots: 1,
                        start_at: 1,
                        end_at: 1,
                        status: 1,
                        notes: 1,
                        location: 1,
                        archivedAt: 1

                    }
                }

            ])
            .toArray();

        return result || [];
    }

    async pendingApprovals() {
 const { db } = await connectDB();

 const result = await db.collection("discount_requests")
 .aggregate([

   {
     $match: {
       status: "pending"
     }
   },

   {
     $lookup: {
       from: "clients",
       localField: "client_id",
       foreignField: "_id",
       as: "client"
     }
   },

   {
     $unwind: "$client"
   },

   {
     $project: {
       _id:1,
       type: {
         $literal: "discount"
       },

       createdAt:1,
       status:1,

       first_name:"$client.first_name",
       last_name:"$client.last_name",
       email:"$client.email",
       phone:"$client.phone",

       selfie_url:1,
       id_url:1
     }
   },

   {
     $unionWith: {
       coll: "membership_requests",
       pipeline: [

         {
           $match:{
             status:"pending"
           }
         },

         {
           $lookup:{
             from:"clients",
             localField:"client_id",
             foreignField:"_id",
             as:"client"
           }
         },

         {
           $unwind:"$client"
         },

         {
           $project:{
             _id:1,

             type:"$request_type",
             createdAt:1,
             status:1,

             first_name:"$client.first_name",
             last_name:"$client.last_name",
             email:"$client.email",
             phone:"$client.phone",

             membership_id:1,
             freeze_start_date:1,
             freeze_end_date:1,
             medical_proof_url:1
           }
         }

       ]
     }
   },

   {
      $sort:{
         createdAt:-1
      }
   },

   {
      $limit:5
   }

 ])
 .toArray();

 
 return result;
}

    async revenueThisMonthCard() {
        const { db } = await connectDB();

        const now = new Date();

        const firstDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

        const lastDay = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,59,59,999
        );

        const result = await db.collection("payments").aggregate([
            {
                $match: {
                    status: "PAID",
                    createdAt: {
                        $gte: firstDay,
                        $lte: lastDay
                    }
                }
            },

            {
                $group: {
                    _id: "$payment_for",
                    totalRevenue: {
                        $sum: "$amount"
                    },
                    transactions: {
                        $sum: 1
                    }
                }
            }

        ]).toArray();


        const revenue = {
            daily_pass: 0,
            membership: 0,
            trainer_booking: 0,
            total: 0
        };


        result.forEach(r => {
            if (r._id === "daily_pass")
                revenue.daily_pass = r.totalRevenue;

            if (r._id === "membership")
                revenue.membership = r.totalRevenue;

            if (r._id === "trainer-booking")
                revenue.trainer_booking = r.totalRevenue;

            revenue.total += r.totalRevenue;
        });

        return revenue;
    }

    async analyticsOverview() {
        const { db } = await connectDB();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        const [
            totalClients,
            activeMemberships,
            totalTrainers,
            activeClasses,
            thisMonthRevenue,
            lastMonthRevenue,
            totalBookings,
            pendingRequests
        ] = await Promise.all([
            db.collection("clients").countDocuments({ role: "client" }),
            db.collection("memberships").countDocuments({ status: "active" }),
            db.collection("trainers").countDocuments({ status: "active" }),
            db.collection("class_schedule").countDocuments({ status: "open", start_at: { $gte: now } }),
            db.collection("payments").aggregate([
                { $match: { status: "PAID", createdAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]).toArray(),
            db.collection("payments").aggregate([
                { $match: { status: "PAID", createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]).toArray(),
            db.collection("bookings").countDocuments(),
            db.collection("discount_requests").countDocuments({ status: { $in: ["submitted", "pending"] } })
        ]);

        const thisMonthTotal = thisMonthRevenue[0]?.total || 0;
        const lastMonthTotal = lastMonthRevenue[0]?.total || 0;
        const revenueGrowth = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1) : 0;

        return {
            totalClients,
            activeMemberships,
            totalTrainers,
            activeClasses,
            thisMonthRevenue: thisMonthTotal,
            lastMonthRevenue: lastMonthTotal,
            revenueGrowth: parseFloat(revenueGrowth),
            totalBookings,
            pendingRequests
        };
    }

    async revenueByMonth(months = 6) {
        const { db } = await connectDB();
        const now = new Date();
        const pipeline = [];

        for (let i = months - 1; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
            
            const monthResult = await db.collection("payments").aggregate([
                { $match: { status: "PAID", createdAt: { $gte: start, $lte: end } } },
                { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
            ]).toArray();

            pipeline.push({
                month: start.toLocaleString("default", { month: "short", year: "2-digit" }),
                revenue: monthResult[0]?.total || 0,
                count: monthResult[0]?.count || 0
            });
        }

        return pipeline;
    }

    async bookingsByType() {
        const { db } = await connectDB();
        
        const [classBookings, trainerBookings] = await Promise.all([
            db.collection("bookings").countDocuments({ type: "class" }),
            db.collection("bookings").countDocuments({ type: "trainer-booking" })
        ]);

        return [
            { name: "Class Bookings", value: classBookings, color: "#dc2626" },
            { name: "Trainer Sessions", value: trainerBookings, color: "#16a34a" }
        ];
    }

   async classPopularity() {
 const { db } = await connectDB();

 const result = await db.collection("bookings").aggregate([
   {
      $match:{
        type:"class",
        status:{ $ne:"cancelled" }
      }
   },

   {
      $lookup:{
        from:"class_schedule",
        localField:"schedule_id",
        foreignField:"_id",
        as:"schedule"
      }
   },

   {
      $unwind:"$schedule"
   },

   {
      $lookup:{
        from:"classes",
        localField:"schedule.class_id",
        foreignField:"_id",
        as:"class"
      }
   },

   {
      $unwind:"$class"
   },

   {
      $group:{
         _id:"$class._id",
         name:{ $first:"$class.name" },
         bookings:{ $sum:1 }
      }
   },

   {
      $sort:{
         bookings:-1
      }
   },

   {
      $limit:10
   },

   {
      $project:{
         _id:0,
         class_id:"$_id",
         name:1,
         bookings:1
      }
   }

 ]).toArray();

 return result;
}

    async clientGrowth(months = 6) {
        const { db } = await connectDB();
        const now = new Date();
        const pipeline = [];

        for (let i = months - 1; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
            
            const count = await db.collection("clients").countDocuments({
                role: "client",
                createdAt: { $gte: start, $lte: end }
            });

            pipeline.push({
                month: start.toLocaleString("default", { month: "short", year: "2-digit" }),
                clients: count
            });
        }

        return pipeline;
    }

    async membershipStatusBreakdown() {
        const { db } = await connectDB();
        
        const result = await db.collection("memberships").aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]).toArray();

        const statusColors = {
            active: "#16a34a",
            expired: "#6b7280",
            frozen: "#3b82f6",
            suspended: "#dc2626"
        };

        return result.map(r => ({
            name: r._id?.charAt(0).toUpperCase() + r._id?.slice(1),
            value: r.count,
            color: statusColors[r._id] || "#6b7280"
        }));
    }

    async topTrainers() {
        const { db } = await connectDB();
        
        const result = await db.collection("bookings").aggregate([
            { $match: { type: "trainer-booking", status: { $ne: "cancelled" } } },
            { $group: { _id: "$trainer_id", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "trainers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "trainerInfo"
                }
            },
            { $unwind: "$trainerInfo" },
            {
                $project: {
                    name: { $concat: ["$trainerInfo.first_name", " ", "$trainerInfo.last_name"] },
                    count: 1
                }
            }
        ]).toArray();

        return result;
    }

    /**
     * 
     * @param {*} filter 
     * @param {*} page 
     * @param {*} limit 
     * @param {*} skip 
     * @returns 
     * 
     * client MANAGEMENT ADMIN DASHBOARD
     */
    async clientsManagement(filter, page, limit, skip) {
        const { db } = await connectDB();

        const pipeline = [
            { $match: filter },

            {
                $addFields: {
                    full_name: {
                        $concat: [
                            { $ifNull: ["$first_name", ""] },
                            " ",
                            { $ifNull: ["$last_name", ""] }
                        ]
                    }
                }
            },

            { $sort: { createdAt: -1 } },

            { $skip: skip },
            { $limit: limit }
        ];

        const clients = await db.collection("clients")
            .aggregate(pipeline)
            .toArray();

        const total = await db.collection("clients")
            .countDocuments(filter);

        return {
            clients,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * 
     * @param {*} filter 
     * @param {*} page 
     * @param {*} limit 
     * @param {*} skip 
     * @returns 
     * 
     * membership REQUEST ADMIN DASHBOARD
     */
    
    async membershipRequests(filter, search, page, limit, skip) {
        const { db } = await connectDB();

        const pipeline = [
            { $match: filter },
            
            // Sort by newest first (descending by createdAt)
            { $sort: { createdAt: -1 } },
            
            // Lookup client data
            {
                $lookup: {
                    from: "clients",
                    localField: "client_id",
                    foreignField: "_id",
                    as: "client"
                }
            },
            { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
            
            // Lookup plan data
            {
                $lookup: {
                    from: "plans",
                    localField: "plan_id",
                    foreignField: "_id",
                    as: "plan"
                }
            },
            { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
            
            // Lookup pricing data
            {
                $lookup: {
                    from: "pricing",
                    localField: "pricing_id",
                    foreignField: "_id",
                    as: "pricing"
                }
            },
            { $unwind: { path: "$pricing", preserveNullAndEmptyArrays: true } },
        ];

        // Add search if provided
        if(search && search.trim().length > 0) {
            pipeline.push({
                $match: {
                    $or: [
                        { "client.first_name": { $regex: search, $options: "i" } },
                        { "client.last_name": { $regex: search, $options: "i" } },
                        { "client.email": { $regex: search, $options: "i" } },
                    ]
                }
            });
        }

        // Add pagination
        pipeline.push(
            { $skip: skip },
            { $limit: limit }
        );

        const results = await db.collection("memberships_request").aggregate(pipeline).toArray();

        // Get total count
        const countPipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: "clients",
                    localField: "client_id",
                    foreignField: "_id",
                    as: "client"
                }
            },
            { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },
        ];
        
        if(search && search.trim().length > 0) {
            countPipeline.push({
                $match: {
                    $or: [
                        { "client.first_name": { $regex: search, $options: "i" } },
                        { "client.last_name": { $regex: search, $options: "i" } },
                        { "client.email": { $regex: search, $options: "i" } },
                    ]
                }
            });
        }
        
        countPipeline.push({ $count: "count" });
        
        const countResult = await db.collection("memberships_request").aggregate(countPipeline).toArray();
        const total = countResult[0]?.count || 0;

        return {
            data: results,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * 
     * @param {*} filter 
     * @param {*} page 
     * @param {*} limit 
     * @param {*} skip 
     * @returns 
     * 
     * membershipS ADMIN DASHBOARD
     */

    async memberships(filter, search, page, limit, skip) {
        const { db } = await connectDB();

        const pipeline = [
            { $match: filter },

            {
                $lookup: {
                    from: "clients",
                    localField: "client_id",
                    foreignField: "_id",
                    as: "client"
                }
            },
            { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },

            ...(search ? [{
                $match: {
                    $or: [
                        { "client.first_name": { $regex: search, $options: "i" } },
                        { "client.last_name": { $regex: search, $options: "i" } }
                    ]
                }
            }] : []),

            {
                $lookup: {
                    from: "plans",
                    localField: "plan_id",
                    foreignField: "_id",
                    as: "plan"
                }
            },
            { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "pricing",
                    localField: "pricing_id",
                    foreignField: "_id",
                    as: "price"
                }
            },
            { $unwind: { path: "$price", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "memberships_request",
                    let: { membershipId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$membership_id", "$membershipId"] }
                            }
                        },
                        { $sort: { createdAt: -1 } },
                        { $limit: 1 } 
                    ],
                    as: "memberships_request"
                }
            },
            {
                $unwind: {
                    path: "$memberships_request",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "active"] }, then: 1 },
                                { case: { $eq: ["$status", "expired"] }, then: 2 },
                                { case: { $eq: ["$status", "cancelled"] }, then: 3 },
                                { case: { $eq: ["$status", "archived"] }, then: 4 }
                            ],
                            default: 5
                        }
                    }
                }
            },

            { $sort: { statusPriority: 1, createdAt: -1 } },

            {
                $project: {
                    _id: 1,
                    client: {
                        first_name: "$client.first_name",
                        last_name: "$client.last_name",
                        email: "$client.email"
                    },
                    plan: {
                        label: "$plan.label",
                        duration_days: "$plan.duration_days",
                        duration: "$plan.duration"
                    },
                    price: {
                        type: "$price.type",
                        price: "$price.price",
                        membership_fee: "$price.membership_fee"
                    },
                    start_date: 1,
                    end_date: 1,
                    status: 1,
                    is_frozen: 1,
                    createdAt: 1,
                    frozen_from: 1,
                    frozen_til: 1,
                    memberships_request: {
                        medical_proof_url: "$memberships_request.medical_proof_url"
                    }
                    
                }
            },

            { $skip: skip },
            { $limit: limit }
        ];

        const result = await db.collection("memberships").aggregate(pipeline).toArray();

        const totalPipeline = pipeline.slice(0, -2); 
        const totalResult = await db.collection("memberships")
            .aggregate([...totalPipeline, { $count: "count" }])
            .toArray();

        const total = totalResult[0]?.count || 0;

        return {
            result,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async payments(filter, search, page, limit, skip) {
        const { db } = await connectDB();

        const pipeline = [
            { $match: filter },

            {
                $lookup: {
                    from: "memberships_request",
                    localField: "membership_request_id",
                    foreignField: "_id",
                    as: "request"
                }
            },
            { $unwind: { path: "$request", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "clients",
                    localField: "client_id",
                    foreignField: "_id",
                    as: "client"
                }
            },
            { $unwind: { path: "$client", preserveNullAndEmptyArrays: true } },

            ...(search ? [{
                $match: {
                    $or: [
                        { "client.first_name": { $regex: search, $options: "i" } },
                        { "client.last_name": { $regex: search, $options: "i" } }
                    ]
                }
            }] : []),

           

            { $sort: { createdAt: -1 } },

            {
                $project: {
                    _id: 1,
                    date: "$createdAt",
                    first_name: "$client.first_name",
                    last_name: "$client.last_name",
                    client: 1,
                    payment_method: 1,
                    type: "$request.request_type",
                    amount: 1,
                    status: 1,
                    external_id: 1
                }
            },

            { $skip: skip },
            { $limit: limit }
        ];

        if (search) {
            pipeline.splice(6, 0, {
                $match: {
                    $or: [
                        { "client.first_name": { $regex: search, $options: "i" } },
                        { "client.last_name": { $regex: search, $options: "i" } }
                    ]
                }
            });
        }
            

        const result = await db.collection("payments").aggregate(pipeline).toArray();
        const total = await db.collection("payments").countDocuments(filter);

        return {
            result,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async classes(page, limit, skip) {
        const { db } = await connectDB();

        const result = await db.collection("classes")
        .find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .toArray()

        const total = await db.collection("classes").countDocuments();

        return {
            page,
            result,
            total,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async schedules(filter, page, limit, skip) {
        const { db } = await connectDB();

        const pipeline = [
            { $match: filter },

            {
                $lookup: {
                    from: "classes",
                    localField: "class_id",
                    foreignField: "_id",
                    as: "class"
                }
            },
            { $unwind: { path: "$class", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "trainers",
                    localField: "trainer_id",
                    foreignField: "_id",
                    as: "trainer"
                }
            },
            { $unwind: { path: "$trainer", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "bookings",
                    let: { scheduleId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$schedule_id", "$$scheduleId"] },
                                status: { $ne: "cancelled" }
                            }
                        }
                    ],
                    as: "bookings"
                }
            },

            {
                $addFields: {
                    joined_count: { $size: "$bookings" },
                    available_slots: {
                        $subtract: ["$capacity", { $size: "$bookings" }]
                    }
                }
            },

            { $sort: { createdAt: -1 } },

            {
                $project: {
                    _id: 1,
                    class: {
                        class_id: "$class._id",
                        name: "$class.name",
                        default_capacity: "$class.default_capacity"
                    },
                    trainer: {
                        trainer_id: "$trainer._id",
                        first_name: "$trainer.first_name",
                        last_name: "$trainer.last_name",
                        email: "$trainer.email",
                        phone: "$trainer.phone"
                    },
                    start_at: 1,
                    end_at: 1,
                    location: 1,
                    notes: 1,
                    capacity: 1,
                    joined_count: 1,
                    available_slots: 1,
                    status: 1,
                    createdAt: 1
                }
            },

            { $skip: skip },
            { $limit: limit },
            
        ];

        const result = await db.collection("class_schedule").aggregate(pipeline).toArray();
        const total = await db.collection("class_schedule").countDocuments(filter);

        return {
            result,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async trainers(filter, page, limit, skip) {
        const { db } = await connectDB();
        
        const pipeline = [
            { $match: filter },

            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "active"] }, then: 1 },
                                { case: { $eq: ["$status", "inactive"] }, then: 2 },
                                { case: { $eq: ["$status", "archived"] }, then: 3 },
                            ],
                            default: 4
                        }
                    }
                }
            },

            { $sort: { statusPriority: -1, createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },

            {
                $project: {
                    _id: 1,
                    first_name: 1,
                    last_name: 1,
                    email: 1,
                    phone: 1,
                    role: 1,
                    status: 1,
                    max_hours: 1,
                    rate: 1,
                    specialization: 1,
                    certification: 1,
                    availability: 1,
                    createdAt: 1,
                    createdBy: 1,
                    updatedAt: 1,
                    updatedBy: 1,
                    archivedAt: 1,
                    archivedBy: 1,
                    user_type: 1
                }
            }
        ];

        const result = await db.collection("trainers").aggregate(pipeline).toArray();
        const total = await db.collection("trainers").countDocuments(filter);

        return {
            result,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async pricing(filter, page, limit) {
        const { db } = await connectDB();

        const prices = await db.collection("pricing").aggregate([
            { $match: filter },


            {
                $lookup: {
                    from: "plans", 
                    localField: "plan_id",
                    foreignField: "_id",
                    as: "plan"
                }
            },

            {
                $unwind: {
                    path: "$plan",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $project: {
                    "plan._id": 1,
                    "plan.label": 1,
                    "plan.name": 1,
                    plan_id: 1,
                    name: 1,
                    label: 1,
                    type: 1,
                    duration_days: 1,
                    price: 1,
                    membership_fee: 1,
                    status: 1,
                    createdAt: 1
                }
            },

            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "active"] }, then: 1 },
                                { case: { $eq: ["$status", "inactive"] }, then: 2 },
                                { case: { $eq: ["$status", "archived"] }, then: 3 }
                            ],
                            default: 4
                        }
                    }
                }
            },

            { $sort: { statusPriority: 1, createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit }

        ]).toArray();
        const total = await db.collection("pricing").countDocuments(filter);

        return {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
            data: prices
        };
    }

    async plans(filter, page, limit) {
        const { db } = await connectDB();
        const plans = await db.collection("plans")
            .aggregate([
            { $match: filter },

            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "active"] }, then: 1},
                                { case: { $eq: ["$status", "inactive"] }, then: 2 },
                                { case: { $eq: ["$status", "archived"] }, then: 3 }
                            ],
                            default: 4
                        }
                    }
                }
            },

            { $sort: { statusPriority: 1, createdAt: -1 } },

            { $skip: (page - 1) * limit },
            { $limit: limit }
        ])
        .toArray();

        const total = await db.collection("plans").countDocuments(filter);

        return { 
            total, page, limit, pages: Math.ceil(total / limit), data: plans };
    }

    async bookings(filter, page, limit) {
        const { db } = await connectDB();

        const result = await db.collection("bookings").aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "clients",
                    localField: "client_id",
                    foreignField: "_id",
                    as: "client"
                }
            },
            { 
                $unwind: {
                    path: "$client",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "class_schedule",
                    localField: "schedule_id",
                    foreignField: "_id",
                    as: "schedule"
                }
            },
            {
                $unwind: {
                    path: "$schedule",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "trainers",
                    localField: "trainer_id",
                    foreignField: "_id",
                    as: "trainer"
                }
            },
            {
                $unwind: {
                    path: "$trainer",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "classes",
                    localField: "schedule.class_id",
                    foreignField: "_id",
                    as: "class"
                }
            },
            {
                $unwind: {
                    path: "$class",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    type: 1,
                    status: 1,
                    joinedAt: 1,
                    bookedAt: 1,
                    cancelledAt: 1,
                    cancelledBy: 1,
                    cancelReason: 1,
                    notes: 1,
                    createdAt: 1,
                    createdBy: 1,
                    updatedAt: 1,
                    updatedBy: 1,
                    trainer_id: 1,
                    schedule_id: 1,

                    client: {
                    _id: "$client._id",
                    first_name: "$client.first_name",
                    last_name: "$client.last_name",
                    email: "$client.email",
                    phone: "$client.phone"
                    },

                    trainer: {
                    _id: "$trainer._id",
                    first_name: "$trainer.first_name",
                    last_name: "$trainer.last_name",
                    email: "$trainer.email",
                    phone: "$trainer.phone"
                    },

                    schedule: {
                    _id: "$schedule._id",
                    start_at: "$schedule.start_at",
                    end_at: "$schedule.end_at",
                    location: "$schedule.location"
                    },

                    class: {
                        _id: "$class._id",
                        name: "$class.name"
                    }
                }
                },
            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "active"] }, then: 1},
                                { case: { $eq: ["$status", "inactive"] }, then: 2 },
                                { case: { $eq: ["$status", "archived"] }, then: 3 }
                            ],
                            default: 4
                        }
                    }
                }
            },

            { $sort: { statusPriority: 1, createdAt: -1 } },

            {
                $project: {
                    statusPriority: 0
                }
            },

            { $skip: (page - 1) * limit },
            { $limit: limit }
        ])
        .toArray();
 

        const total = await db.collection("bookings").countDocuments(filter);

        return {
            result,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async discounts(filter, page, limit) {
        const { db } = await connectDB();

        const result = await db.collection("discount_requests").aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "clients",
                    localField: "client_id",
                    foreignField: "_id",
                    as: "client"
                }
            },
            { 
                $unwind: {
                    path: "$client",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "memberships_request",
                    localField: "membership_request_id",
                    foreignField: "_id",
                    as: "membership_request"
                }
            },
            { 
                $unwind: {
                    path: "$membership_request",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "plans",
                    localField: "membership_request.plan_id",
                    foreignField: "_id",
                    as: "plan"
                }
            },
            { 
                $unwind: {
                    path: "$plan",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "pricing",
                    localField: "membership_request.pricing_id",
                    foreignField: "_id",
                    as: "pricing"
                }
            },
            { 
                $unwind: {
                    path: "$pricing",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    status: 1,
                    selfie_url: 1,
                    id_url: 1,
                    reviewed_at: 1,
                    reviewed_by: 1,
                    createdAt: 1,
                    createdBy: 1,
                    updatedAt: 1,
                    updatedBy: 1,

                    client: {
                        _id: "$client._id",
                        first_name: "$client.first_name",
                        last_name: "$client.last_name",
                        email: "$client.email",
                        phone: "$client.phone"
                    },

                    membership_request: {
                        _id: "$membership_request._id",
                        is_discounted: "$membership_request.is_discounted",
                        request_type: "$membership_request.request_type",
                        freeze_start_date: "$membership_request.freeze_start_date",
                        freeze_end_date: "$membership_request.freeze_end_date",
                        medical_proof_url: "$membership_request.medical_proof_url",
                    },

                    plan: {
                        _id: "$plan._id",
                        label: "$plan.label",
                        duration_days: "$plan.duration_days",
                        duration: "$plan.duration",
                    },

                    pricing: {
                        _id: "$pricing._id",
                        price: "$pricing.price",
                        membership_fee: "$pricing.membership_fee",
                        type: "$pricing.type",
                    }
                }
                },
            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "active"] }, then: 1},
                                { case: { $eq: ["$status", "inactive"] }, then: 2 },
                                { case: { $eq: ["$status", "archived"] }, then: 3 }
                            ],
                            default: 4
                        }
                    }
                }
            },

            { $sort: { statusPriority: 1, createdAt: -1 } },

            {
                $project: {
                    statusPriority: 0
                }
            },

            { $skip: (page - 1) * limit },
            { $limit: limit }
        ])
        .toArray();

        const total = await db.collection("discount_requests").countDocuments(filter);

        return {
            result,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async airecommendations(filter, page, limit) {
        const { db } = await connectDB();

        const result = await db.collection("business_recommendations").aggregate([
            { $match: filter },

            {
                $lookup: {
                    from: "clients",
                    localField: "client_id",
                    foreignField: "_id",
                    as: "client"
                }
            },
            {
                $unwind: {
                    path: "$client",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $lookup: {
                    from: "trainers", 
                    localField: "trainer_id",
                    foreignField: "_id",
                    as: "trainer"
                }
            },
            {
                $unwind: {
                    path: "$trainer",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $project: {
                    _id: 1,
                    parent_id: 1,
                    version: 1,
                    status: 1,
                    createdAt: 1,
                    createdBy: 1,

                    title: "$recommendation.title",
                    summary: "$recommendation.summary",
                    estimated_difficulty: "$recommendation.estimated_difficulty",

                    trainer_decision: {
                        decision: "$trainer_decision.decision",
                        comment: "$trainer_decision.comment",
                        decidedAt: "$trainer_decision.decidedAt",
                        decidedBy: "$trainer_decision.decidedBy"
                    },

                    client: {
                        _id: "$client._id",
                        first_name: "$client.first_name",
                        last_name: "$client.last_name",
                        email: "$client.email"
                    },

                    trainer: {
                        _id: "$trainer._id",
                        first_name: "$trainer.first_name",
                        last_name: "$trainer.last_name",
                        email: "$trainer.email"
                    }
                }
            },

            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "pending"] }, then: 1 },
                                { case: { $eq: ["$status", "approved"] }, then: 2 },
                                { case: { $eq: ["$status", "rejected"] }, then: 3 }
                            ],
                            default: 4
                        }
                    }
                }
            },

            { $sort: { statusPriority: 1, createdAt: -1 } },

            {
                $project: {
                    statusPriority: 0
                }
            },
    
            { $skip: (page - 1) * limit },
            { $limit: limit }

        ]).toArray();

        const total = await db.collection("ai_recommendations").countDocuments(filter);

        return {
            result,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async membershipconfig(filter, page, limit) {
        const { db } = await connectDB();
        const skip = (page - 1) * limit;

        const result = await db.collection("membership_config").aggregate([
            { $match: filter },
            {
                $addFields: {
                    statusPriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$status", "active"] }, then: 1 },
                                { case: { $eq: ["$status", "inactive"] }, then: 2 },
                                { case: { $eq: ["$status", "archived"] }, then: 3 },
                            ],
                            default: 4
                        }
                    }
                }
            },
            { $sort: { statusPriority: 1, createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]).toArray();

        const total = await db.collection("membership_config").countDocuments(filter);

        if (!result.length) {
            return {
                page,
                limit,
                result: [],
                total: 0,
                totalPages: 0
            };
        }

        return {
            page,
            limit,
            result,
            total,
            totalPages: Math.ceil(total / limit)
        };
    }
} 

export default new AdminDashboardModel();