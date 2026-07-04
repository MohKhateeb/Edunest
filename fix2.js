const fs = require('fs');

const filesToFix = [
  {
    path: 'components/shared/Sidebar.tsx',
    fixes: [
      {
        find: /const ADVISOR_TIPS: Record<[\s\S]*?> = {/m,
        replace: `const getADVISORTIPS = (t: any): Record<"PARENT" | "TEACHER" | "ADMIN", Array<{ advisor: "hakeem" | "najeeb"; text: string }>> => ({`
      },
      {
        find: /};\n\nexport default function Sidebar/m,
        replace: `});\n\nexport default function Sidebar`
      },
      {
        find: /ADVISOR_TIPS\[role as keyof typeof ADVISOR_TIPS\] \|\| ADVISOR_TIPS\.PARENT;/g,
        replace: `getADVISORTIPS(tNav)[role as keyof ReturnType<typeof getADVISORTIPS>] || getADVISORTIPS(tNav).PARENT;`
      }
    ]
  },
  {
    path: 'app/[locale]/dashboard/teacher/bookings/[id]/page.tsx',
    fixes: [
      {
        find: /export default async function TeacherBookingDetailsPage\({[\s\S]*?}: {[\s\S]*?params: Promise<{ id: string }>;[\s\S]*?}\) {/m,
        replace: `export default async function TeacherBookingDetailsPage({\n\tparams,\n}: {\n\tparams: Promise<{ id: string; locale: string }>;\n}) {\n\tconst { locale } = await params;\n\tconst t = await getTranslations({ locale, namespace: 'teachers' });`
      },
      {
        find: /import { getTranslations } from "next-intl\/server";\n/g,
        replace: ``
      }
    ]
  },
  {
    path: 'app/[locale]/dashboard/parent/financials/page.tsx',
    fixes: [
      {
        find: /const renderPaymentStatus = \(booking: FinancialBooking\) => {/g,
        replace: `const renderPaymentStatus = (booking: FinancialBooking, t: any) => {`
      },
      {
        find: /const renderDisputeAction = \(booking: FinancialBooking\) => {/g,
        replace: `const renderDisputeAction = (booking: FinancialBooking, t: any) => {`
      },
      {
        find: /renderPaymentStatus\(booking\)/g,
        replace: `renderPaymentStatus(booking, t)`
      },
      {
        find: /renderDisputeAction\(booking\)/g,
        replace: `renderDisputeAction(booking, t)`
      }
    ]
  },
  {
    path: 'app/[locale]/dashboard/admin/financials/page.tsx',
    fixes: [
      {
        find: /revenueDetails\.map\(t => \(/g,
        replace: `revenueDetails.map(transaction => (`
      },
      {
        find: /t\.id/g,
        replace: `transaction.id`
      },
      {
        find: /t\.date/g,
        replace: `transaction.date`
      },
      {
        find: /t\.type/g,
        replace: `transaction.type`
      },
      {
        find: /t\.amount/g,
        replace: `transaction.amount`
      },
      {
        find: /t\.description/g,
        replace: `transaction.description`
      }
    ]
  }
];

filesToFix.forEach(fileDef => {
  if (fs.existsSync(fileDef.path)) {
    let content = fs.readFileSync(fileDef.path, 'utf8');
    
    // special handling for teacher/bookings/[id]/page.tsx missing import
    if (fileDef.path.includes('teacher/bookings/[id]/page.tsx')) {
      if (!content.includes('getTranslations')) {
        content = 'import { getTranslations } from "next-intl/server";\n' + content;
      }
    }
    
    fileDef.fixes.forEach(fix => {
      content = content.replace(fix.find, fix.replace);
    });
    fs.writeFileSync(fileDef.path, content, 'utf8');
    console.log('Fixed', fileDef.path);
  }
});
