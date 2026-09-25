import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../components/Layout';
import { ArrowLeft, Download, Search } from 'lucide-react';

interface RegisteredUser {
  id: number;
  name: string;
  dob?: string;
  aadhaar?: string;
  country?: string;
  currentPlace?: string;
  currentAddress?: string;
  currentPincode?: string;
  indianAddress?: string;
  indianState?: string;
  indianDistrict?: string;
  indianPlace?: string;
  assemblyConstituency?: string;
  parliamentConstituency?: string;
  constituency?: string;
}

function formatDobToDDMMYYYY(dob?: string): string {
  if (!dob || !dob.trim()) return '—';
  const clean = dob.trim();

  // If already in DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    return clean;
  }

  // If in YYYY-MM-DD format (standard HTML date input format)
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [year, month, day] = clean.split('-');
    return `${day}/${month}/${year}`;
  }

  // If in DD-MM-YYYY format
  if (/^\d{2}-\d{2}-\d{4}$/.test(clean)) {
    const [day, month, year] = clean.split('-');
    return `${day}/${month}/${year}`;
  }

  // Fallback for valid date representations
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return clean;
}

export function DownloadVotersPage() {
  const navigate = useNavigate();
  const [filterCountry, setFilterCountry] = useState('');
  const [filterPlace, setFilterPlace] = useState('');

  const allUsers: RegisteredUser[] = JSON.parse(localStorage.getItem('registeredUsers') || '[]');

  const countryOptions = Array.from(new Set(allUsers.map(u => u.country).filter(Boolean))) as string[];
  const placeOptions = Array.from(
    new Set(
      allUsers
        .filter(u => !filterCountry || u.country === filterCountry)
        .map(u => u.currentPlace)
        .filter(Boolean)
    )
  ) as string[];

  const filteredUsers = allUsers.filter(u => {
    if (filterCountry && u.country !== filterCountry) return false;
    if (filterPlace && u.currentPlace !== filterPlace) return false;
    return true;
  });

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterCountry(e.target.value);
    setFilterPlace('');
  };

  const handleDownloadPDF = () => {
    const rows = filteredUsers.map((u, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
        <td>${i + 1}</td>
        <td>${u.name || '—'}</td>
        <td>${formatDobToDDMMYYYY(u.dob)}</td>
        <td>${u.country || '—'}</td>
        <td>${u.currentPlace || '—'}</td>
        <td>${u.currentAddress || '—'}</td>
        <td>${u.indianState || '—'}</td>
        <td>${u.indianDistrict || '—'}</td>
        <td>${u.assemblyConstituency || '—'}</td>
        <td>${u.parliamentConstituency || u.constituency || '—'}</td>
      </tr>`).join('');

    const filterLabel = [
      filterCountry ? `Country: ${filterCountry}` : '',
      filterPlace ? `Place: ${filterPlace}` : '',
    ].filter(Boolean).join(' | ') || 'All Countries & Places';

    const printContent = `
      <div style="font-family:Arial,sans-serif;font-size:9pt;color:#1a1a2e;">
        <div style="display:flex;align-items:center;gap:14px;padding:14px 0 12px;border-bottom:3px solid #138808;">
          <div style="width:52px;height:52px;border-radius:50%;background:conic-gradient(#FF9933 0deg 120deg,#fff 120deg 240deg,#138808 240deg 360deg);display:flex;align-items:center;justify-content:center;border:2px solid #ddd;flex-shrink:0;">
            <span style="font-weight:900;font-size:13pt;color:#000080;">IN</span>
          </div>
          <div>
            <div style="font-size:17pt;font-weight:900;color:#000080;">NRI Remote Voting System</div>
            <div style="font-size:9pt;color:#555;margin-top:2px;">Government of India &nbsp;|&nbsp; Voter Details Report</div>
          </div>
        </div>
        <div style="padding:7px 0;background:#f0f4ff;margin:8px 0 4px;font-size:8.5pt;color:#333;">
          <strong style="color:#000080;">Filter:</strong> ${filterLabel} &nbsp;&nbsp;
          <strong style="color:#000080;">Total:</strong> ${filteredUsers.length} record(s)
        </div>
        <div style="font-size:7.5pt;color:#666;margin-bottom:8px;">
          Generated: ${new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:7.5pt;">
          <thead>
            <tr style="background:linear-gradient(to right,#FF9933,#138808);color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
              <th style="padding:6px 4px;text-align:left;border:1px solid rgba(255,255,255,0.3);">#</th>
              <th style="padding:6px 4px;text-align:left;border:1px solid rgba(255,255,255,0.3);">Name</th>
              <th style="padding:6px 4px;text-align:left;border:1px solid rgba(255,255,255,0.3);">Date of Birth</th>
              <th style="padding:6px 4px;text-align:left;border:1px solid rgba(255,255,255,0.3);">Country</th>
              <th style="padding:6px 4px;text-align:left;border:1px solid rgba(255,255,255,0.3);">Current Place</th>
              <th style="padding:6px 4px;text-align:left;border:1px solid rgba(255,255,255,0.3);">Current Address</th>
              <th style="padding:6px 4px;text-align:left;border:1px solid rgba(255,255,255,0.3);">State</th>
              <th style="padding:6px 4px;text-align:left;border:1px solid rgba(255,255,255,0.3);">District</th>
              <th style="padding:6px 4px;text-align:left;border:1px solid rgba(255,255,255,0.3);">Assembly Constituency</th>
              <th style="padding:6px 4px;text-align:left;border:1px solid rgba(255,255,255,0.3);">Parliament Constituency</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="10" style="text-align:center;padding:16px;color:#999;">No records found.</td></tr>'}
          </tbody>
        </table>
        <div style="margin-top:14px;padding-top:8px;border-top:2px solid #138808;display:flex;justify-content:space-between;font-size:7.5pt;color:#555;">
          <span>NRI Remote Voting System — Government of India — Confidential</span>
          <span>Total: ${filteredUsers.length} record(s)</span>
        </div>
      </div>`;

    // Inject into page, print, then remove
    const printStyle = document.createElement('style');
    printStyle.id = '__nri_print_style__';
    printStyle.innerHTML = `
      @media print {
        @page { size: A4 landscape; margin: 10mm; }
        body > *:not(#__nri_print_root__) { display: none !important; }
        #__nri_print_root__ { display: block !important; }
      }
      #__nri_print_root__ { display: none; }
    `;

    const printRoot = document.createElement('div');
    printRoot.id = '__nri_print_root__';
    printRoot.innerHTML = printContent;

    document.head.appendChild(printStyle);
    document.body.appendChild(printRoot);

    window.print();

    document.head.removeChild(printStyle);
    document.body.removeChild(printRoot);
  };

  const selectCls = 'w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none bg-white';

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-blue-900 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-xl border-t-4 border-blue-900 overflow-hidden">

          {/* PDF Preview Header */}
          <div className="flex items-center gap-4 px-8 py-5 bg-white border-b-2 border-green-600">
            <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center font-black text-blue-900 text-sm border-2 border-gray-200"
              style={{ background: 'conic-gradient(#FF9933 0deg 120deg, #fff 120deg 240deg, #138808 240deg 360deg)' }}>
              IN
            </div>
            <div>
              <h1 className="text-2xl font-black text-blue-900 tracking-wide">NRI Remote Voting System</h1>
              <p className="text-gray-500 text-sm">Government of India</p>
            </div>
          </div>

          <div className="p-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-1">Download Voter Details</h2>
            <p className="text-gray-600 mb-6">Filter voters by country and place, then download as PDF</p>

            {/* Filters */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Search className="w-4 h-4 text-orange-500" /> Filter Voters
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
                  <select value={filterCountry} onChange={handleCountryChange} className={selectCls}>
                    <option value="">-- Choose Country --</option>
                    {countryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Place / City</label>
                  <select value={filterPlace} onChange={e => setFilterPlace(e.target.value)} className={selectCls} disabled={!filterCountry}>
                    <option value="">{filterCountry ? '-- Choose Place / City --' : 'Select country first'}</option>
                    {placeOptions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                {filterCountry && filterPlace ? (
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-blue-900">{filteredUsers.length}</span> voter{filteredUsers.length !== 1 ? 's' : ''} match the filter ({filterCountry} · {filterPlace})
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    {!filterCountry ? 'Select a country and place to view voter details' : 'Select a place/city to view voter details'}
                  </p>
                )}
                {(filterCountry || filterPlace) && (
                  <button onClick={() => { setFilterCountry(''); setFilterPlace(''); }} className="text-sm text-red-500 hover:underline cursor-pointer">
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Voter Details & Download - ONLY shown when BOTH country and place are selected */}
            {filterCountry && filterPlace ? (
              <>
                {/* Preview Table */}
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden mb-6">
                  <div className="px-5 py-3 bg-blue-900 text-white text-sm font-semibold flex justify-between items-center">
                    <span>Preview — {filteredUsers.length} Record{filteredUsers.length !== 1 ? 's' : ''}</span>
                    <span className="text-xs opacity-75">Scroll right to see all columns</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-orange-500 to-green-600 text-white">
                          <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">#</th>
                          <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">Name</th>
                          <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">Date of Birth</th>
                          <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">Country</th>
                          <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">Current Place</th>
                          <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">Current Address</th>
                          <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">State</th>
                          <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">District</th>
                          <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">Assembly Constituency</th>
                          <th className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">Parliament Constituency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                              No voters found for {filterCountry} ({filterPlace}).
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u, i) => (
                            <tr key={u.id} className={`border-b hover:bg-yellow-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                              <td className="px-4 py-3 font-semibold text-blue-900 whitespace-nowrap">{u.name || '—'}</td>
                              <td className="px-4 py-3 text-gray-700 whitespace-nowrap font-mono">{formatDobToDDMMYYYY(u.dob)}</td>
                              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{u.country || '—'}</td>
                              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{u.currentPlace || '—'}</td>
                              <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{u.currentAddress || '—'}</td>
                              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{u.indianState || '—'}</td>
                              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{u.indianDistrict || '—'}</td>
                              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{u.assemblyConstituency || '—'}</td>
                              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{u.parliamentConstituency || u.constituency || '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Download Button */}
                <button
                  onClick={handleDownloadPDF}
                  disabled={filteredUsers.length === 0}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-900 to-blue-800 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-800 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Download className="w-6 h-6" />
                  Download PDF ({filteredUsers.length} voter{filteredUsers.length !== 1 ? 's' : ''})
                </button>
                <p className="text-center text-xs text-gray-500 mt-2">
                  Opens print dialog — choose "Save as PDF" to download
                </p>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
}
