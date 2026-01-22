// 'use client';

// import { useEffect, useState } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";

// export default function AdminPaymentsPage() {
//   const [payments, setPayments] = useState<any[]>([]);

//   useEffect(() => {
//     fetch("/api/bookings?paymentStatus=paid")
//       .then(res => res.json())
//       .then(setPayments);
//   }, []);

//   return (
//     <div className="space-y-6">
//       <h1 className="text-2xl font-bold">Payments</h1>

//       {payments.map(p => (
//         <Card key={p._id}>
//           <CardContent className="p-4 grid grid-cols-2 gap-3 text-sm">
//             <div><b>User:</b> {p.userName}</div>
//             <div><b>Email:</b> {p.email}</div>
//             <div><b>Building:</b> {p.building}</div>
//             <div><b>Apt:</b> {p.apartmentNumber}</div>
//             <div><b>Amount:</b> ${p.price}</div>
//             <div>
//               <b>Status:</b>{" "}
//               <Badge>{p.paymentStatus}</Badge>
//             </div>
//             {/* <div className="col-span-2 text-xs text-muted-foreground">
//               PaymentIntent: {p.paymentIntentId}
//             </div> */}
//           </CardContent>
//         </Card>
//       ))}
//     </div>
//   );
// }

// 'use client';

// import { useEffect, useState } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";

// const statusColors: Record<string, string> = {
//   paid: "bg-green-500",
//   refunded: "bg-blue-500",
//   unknown: "bg-gray-400",
// };

// export default function AdminPaymentsPage() {
//   const [payments, setPayments] = useState<any[]>([]);

//   const fetchPayments = () => {
//     fetch("/api/bookings")
//       .then(res => res.json())
//       .then(setPayments);
//   };

//   useEffect(() => {
//     fetchPayments();
//   }, []);

//   const markAsRefunded = async (id: string) => {
//     await fetch(`/api/bookings?id=${id}`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ paymentStatus: "refunded" }),
//     });

//     setPayments(prev =>
//       prev.map(p =>
//         p._id === id ? { ...p, paymentStatus: "refunded" } : p
//       )
//     );
//   };

//   return (
//     <div className="space-y-6">
//       {/* Heading */}
//       <div>
//         <h1 className="text-2xl font-bold">Payments</h1>

//         {/* Legend */}
//         <div className="flex items-center gap-6 text-sm mt-2">
//           <div className="flex items-center gap-2">
//             <span className="h-3 w-3 rounded-full bg-green-500" />
//             Paid
//           </div>
//           <div className="flex items-center gap-2">
//             <span className="h-3 w-3 rounded-full bg-blue-500" />
//             Refunded
//           </div>
//         </div>
//       </div>

//       {payments.map(p => {
//         const status = p.paymentStatus ?? "paid"; // ✅ SAFE DEFAULT

//         return (
//           <Card key={p._id}>
//             <CardContent className="p-4 grid grid-cols-2 gap-3 text-sm">
//               <div><b>User:</b> {p.userName}</div>
//               <div><b>Email:</b> {p.email}</div>
//               <div><b>Building:</b> {p.building}</div>
//               <div><b>Apt:</b> {p.apartmentNumber}</div>

//               <div>
//                 <b>Amount:</b>{" "}
//                 {new Intl.NumberFormat("en-CA", {
//                   style: "currency",
//                   currency: "CAD",
//                 }).format(p.price)}
//               </div>

//               <div className="flex items-center gap-2">
//                 <b>Status:</b>
//                 <Badge
//                   className={`${statusColors[status] ?? statusColors.unknown} text-white`}
//                 >
//                   {status.toUpperCase()}
//                 </Badge>
//               </div>

//               {status === "paid" && (
//                 <div className="col-span-2">
//                   <Button
//                     size="sm"
//                     variant="outline"
//                     onClick={() => markAsRefunded(p._id)}
//                   >
//                     Mark as Refunded
//                   </Button>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         );
//       })}
//     </div>
//   );
// }


'use client';

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/bookings")
      .then(res => res.json())
      .then(setPayments);
  }, []);

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>

        {/* Legend */}
        <div className="flex items-center gap-2 text-sm mt-2">
          <span className="h-3 w-3 rounded-full bg-green-500" />
          Paid
        </div>
      </div>

      {payments.map(p => (
        <Card key={p._id}>
          <CardContent className="p-4 grid grid-cols-2 gap-3 text-sm">
            <div><b>User:</b> {p.userName}</div>
            <div><b>Email:</b> {p.email}</div>
            <div><b>Building:</b> {p.building}</div>
            <div><b>Apt:</b> {p.apartmentNumber}</div>

            <div>
              <b>Amount:</b>{" "}
              {new Intl.NumberFormat("en-CA", {
                style: "currency",
                currency: "CAD",
              }).format(p.price)}
            </div>

            <div className="flex items-center gap-2">
              <b>Status:</b>
              <Badge className="bg-green-500 text-white">
                PAID
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
