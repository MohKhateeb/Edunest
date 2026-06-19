'use client';

import { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import type { FAQ } from '@prisma/client';

export default function FAQAccordion({ faqs }: { faqs: FAQ[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOpen = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 end-0 pe-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          dir="rtl"
          placeholder="ابحث في الأسئلة الشائعة..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full ps-3 pe-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm shadow-sm transition-shadow"
        />
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm transition-all hover:shadow-md"
            >
              <button
                onClick={() => toggleOpen(faq.id)}
                className="w-full px-6 py-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors focus:outline-none"
              >
                <h3 className="text-lg font-medium text-gray-900 text-right">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${
                    openId === faq.id ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                  openId === faq.id ? 'max-h-96 py-4 border-t border-gray-100' : 'max-h-0 py-0'
                }`}
              >
                <p className="text-gray-600 text-base leading-relaxed whitespace-pre-wrap">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">لم يتم العثور على نتائج تطابق بحثك.</p>
          </div>
        )}
      </div>
    </div>
  );
}
