const fs = require("fs");
const path = require("path");

function patchTimeFirstBookingForm() {
	const file = path.join(
		__dirname,
		"components/shared/TimeFirstBookingForm.tsx",
	);
	let content = fs.readFileSync(file, "utf8");

	// Add imports
	if (!content.includes("useBookingSubmission")) {
		content = content.replace(
			"import { PaymentModal } from '@/components/shared/PaymentModal';",
			"import { PaymentModal } from '@/components/shared/PaymentModal';\nimport { useBookingSubmission } from '@/hooks/useBookingSubmission';\nimport { NoStudentsState } from '@/components/bookings/NoStudentsState';\nimport { BookingSuccessState } from '@/components/bookings/BookingSuccessState';\nimport { TrialToggle } from '@/components/bookings/TrialToggle';\nimport { QuickQuestionFields } from '@/components/bookings/QuickQuestionFields';",
		);
	}

	// Replace state
	const stateRegex =
		/\/\/ حالة الإرسال[\s\S]*?const \[success, setSuccess\] = useState\(false\);/;
	content = content.replace(
		stateRegex,
		`// حالة الإرسال\n  const { createdBooking, loading, errorMsg, setErrorMsg, success, submitBooking, closePaymentModal } = useBookingSubmission();`,
	);

	// Replace submit
	const submitRegex =
		/const handleBookingSubmit = async \\(e: React\\.FormEvent\\) => \\{[\\s\\S]*?\/\/ عرض اسم الوقت المختار/;
	const newSubmit = `const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookingDetails.selectedStudentId) {
      setErrorMsg('يرجى تحديد الطالب');
      return;
    }
    if (!bookingDetails.selectedServiceId || !bookingDetails.selectedTeacher) {
      setErrorMsg('يرجى تحديد الخدمة المطلوبة');
      return;
    }

    const startTime = new Date(\`\${searchQuery.selectedDate}T\${searchQuery.selectedTime}:00\`);

    await submitBooking({
      studentId: bookingDetails.selectedStudentId,
      teacherServiceId: bookingDetails.selectedServiceId,
      startTime,
      isTrial: bookingDetails.isTrial,
      questionTitle: activeService?.serviceTypeName === 'شرح مسألة سريعة' ? bookingDetails.questionTitle : undefined,
      questionDetails: activeService?.serviceTypeName === 'شرح مسألة سريعة' ? bookingDetails.questionDetails : undefined,
      questionImageUrl: activeService?.serviceTypeName === 'شرح مسألة سريعة' ? bookingDetails.questionImageUrl : undefined,
      parentNotes: bookingDetails.parentNotes || undefined,
      price: activeService?.price || 0,
    });
  };

  // عرض اسم الوقت المختار`;
	content = content.replace(submitRegex, newSubmit);

	// Replace NoStudentsState
	const noStudentsRegex =
		/if \(students\.length === 0\) {[\s\S]*?return \([\s\S]*?<div className="bg-card border border-border rounded-xl p-8 text-center max-w-md mx-auto space-y-4">[\s\S]*?<\/div>[\s\S]*?\);[\s\S]*?}/;
	content = content.replace(
		noStudentsRegex,
		`if (students.length === 0) {
    return <NoStudentsState />;
  }`,
	);

	// Replace BookingSuccessState
	const successStateRegex =
		/if \(success\) {[\s\S]*?return \([\s\S]*?<div className="bg-card border border-border rounded-2xl p-8 shadow-sm max-w-2xl mx-auto">[\s\S]*?<\/div>[\s\S]*?\);[\s\S]*?}/;
	content = content.replace(
		successStateRegex,
		`if (success) {
    return <BookingSuccessState />;
  }`,
	);

	// Replace PaymentModal onClose
	const paymentModalRegex =
		/<PaymentModal[\s\S]*?onClose={\(\) => {[\s\S]*?}}[\s\S]*?\/>/;
	content = content.replace(
		paymentModalRegex,
		`<PaymentModal
          bookingId={createdBooking.id}
          price={createdBooking.price}
          onClose={closePaymentModal}
        />`,
	);

	// Replace TrialToggle
	const trialRegex =
		/\{!hasUsedTrial && \([\s\S]*?<div className="flex items-center gap-2 p-3 bg-purple-50[\s\S]*?<\/div>[\s\S]*?\)\}/;
	content = content.replace(
		trialRegex,
		`{!hasUsedTrial && (
              <TrialToggle isTrial={bookingDetails.isTrial} onChange={(c) => handleBookingChange('isTrial', c)} />
            )}`,
	);

	// Replace QuickQuestionFields
	const quickQRegex =
		/\{activeService\?\.serviceTypeName === 'شرح مسألة سريعة' && \([\s\S]*?<div className="bg-accent\/40 border border-border rounded-xl p-4 space-y-3 animate-fadeIn">[\s\S]*?<\/div>[\s\S]*?\)\}/;
	content = content.replace(
		quickQRegex,
		`{activeService?.serviceTypeName === 'شرح مسألة سريعة' && (
              <QuickQuestionFields
                title={bookingDetails.questionTitle}
                details={bookingDetails.questionDetails}
                onChange={handleBookingChange}
              />
            )}`,
	);

	fs.writeFileSync(file, content);
	console.log("Patched TimeFirstBookingForm.tsx");
}

function patchNewBookingForm() {
	const file = path.join(__dirname, "components/shared/NewBookingForm.tsx");
	let content = fs.readFileSync(file, "utf8");

	// Add imports
	if (!content.includes("useBookingSubmission")) {
		content = content.replace(
			"import { PaymentModal } from '@/components/shared/PaymentModal';",
			"import { PaymentModal } from '@/components/shared/PaymentModal';\nimport { useBookingSubmission } from '@/hooks/useBookingSubmission';\nimport { NoStudentsState } from '@/components/bookings/NoStudentsState';\nimport { BookingSuccessState } from '@/components/bookings/BookingSuccessState';\nimport { TrialToggle } from '@/components/bookings/TrialToggle';\nimport { QuickQuestionFields } from '@/components/bookings/QuickQuestionFields';",
		);
	}

	// Replace state
	const stateRegex =
		/const \[createdBooking, setCreatedBooking\] = useState[\s\S]*?const \[success, setSuccess\] = useState\(false\);/;
	content = content.replace(
		stateRegex,
		`const { createdBooking, loading, errorMsg, setErrorMsg, success, submitBooking, closePaymentModal } = useBookingSubmission();`,
	);

	// Replace submit
	const submitRegex =
		/const handleBookingSubmit = async \(e: React\.FormEvent\) => {[\s\S]*?if \(students\.length === 0\)/;
	const newSubmit = `const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.selectedStudentId) {
      setErrorMsg('يرجى تحديد الطالب');
      return;
    }
    if (!formData.selectedTutorId) {
      setErrorMsg('يرجى تحديد المعلم');
      return;
    }
    if (!formData.selectedServiceId) {
      setErrorMsg('يرجى تحديد نوع الخدمة المطلوب حجزها');
      return;
    }
    if (!formData.startTime) {
      setErrorMsg('يرجى تحديد تاريخ ووقت الجلسة المطلوب');
      return;
    }

    await submitBooking({
      studentId: formData.selectedStudentId,
      teacherServiceId: formData.selectedServiceId,
      startTime: formData.startTime,
      isTrial: formData.isTrial,
      questionTitle: activeService?.serviceType.name === 'شرح مسألة سريعة' ? formData.questionTitle : undefined,
      questionDetails: activeService?.serviceType.name === 'شرح مسألة سريعة' ? formData.questionDetails : undefined,
      questionImageUrl: activeService?.serviceType.name === 'شرح مسألة سريعة' ? formData.questionImageUrl : undefined,
      parentNotes: formData.parentNotes || undefined,
      price: activeService?.price || 0,
    });
  };

  if (students.length === 0)`;
	content = content.replace(submitRegex, newSubmit);

	// Replace NoStudentsState
	const noStudentsRegex =
		/if \(students\.length === 0\) {[\s\S]*?return \([\s\S]*?<div className="bg-card border border-border rounded-xl p-8 text-center max-w-md mx-auto space-y-4">[\s\S]*?<\/div>[\s\S]*?\);[\s\S]*?}/;
	content = content.replace(
		noStudentsRegex,
		`if (students.length === 0) {
    return <NoStudentsState />;
  }`,
	);

	// Replace BookingSuccessState
	const successStateRegex =
		/\{success \? \([\s\S]*?<div className="text-center py-8 space-y-3">[\s\S]*?<\/div>[\s\S]*?\) : \(/;
	content = content.replace(
		successStateRegex,
		`{success ? (\n          <BookingSuccessState />\n        ) : (`,
	);

	// Replace PaymentModal onClose
	const paymentModalRegex =
		/<PaymentModal[\s\S]*?onClose={\(\) => {[\s\S]*?}}[\s\S]*?\/>/;
	content = content.replace(
		paymentModalRegex,
		`<PaymentModal
          bookingId={createdBooking.id}
          price={createdBooking.price}
          onClose={closePaymentModal}
        />`,
	);

	// Replace TrialToggle
	const trialRegex =
		/\{formData\.selectedServiceId && !hasUsedTrial && \([\s\S]*?<div className="flex items-center gap-2 p-3 bg-purple-50[\s\S]*?<\/div>[\s\S]*?\)\}/;
	content = content.replace(
		trialRegex,
		`{formData.selectedServiceId && !hasUsedTrial && (
              <TrialToggle isTrial={formData.isTrial} onChange={(c) => handleCheckboxChange('isTrial', c)} />
            )}`,
	);

	// Replace QuickQuestionFields
	const quickQRegex =
		/\{activeService\?\.serviceType\.name === 'شرح مسألة سريعة' && \([\s\S]*?<div className="bg-accent\/40 border border-border rounded-xl p-4 space-y-3 animate-fadeIn">[\s\S]*?<\/div>[\s\S]*?\)\}/;
	content = content.replace(
		quickQRegex,
		`{activeService?.serviceType.name === 'شرح مسألة سريعة' && (
              <QuickQuestionFields
                title={formData.questionTitle}
                details={formData.questionDetails}
                onChange={(name, value) => handleCustomChange(name, value)}
              />
            )}`,
	);

	fs.writeFileSync(file, content);
	console.log("Patched NewBookingForm.tsx");
}

patchTimeFirstBookingForm();
patchNewBookingForm();
