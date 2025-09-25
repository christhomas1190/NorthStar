import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

const mockStudents = [
  { id: "S-101", name: "Marcus Lee", tier: "Tier 2", interventions: ["Small group counseling", "Check-in/Check-out"] },
  { id: "S-102", name: "Sofia Perez", tier: "Tier 3", interventions: ["One-on-one mentoring"] },
  { id: "S-103", name: "David Chen", tier: "Tier 1", interventions: ["Classroom participation goals"] },
];
export default function TeacherConsole() {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cautionText, setCautionText] = useState("");
  const [incidentTime, setIncidentTime] = useState("");

  const filteredStudents = mockStudents.filter((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

 const handleSaveCaution = () => {
    console.log("Saved caution:", cautionText, "Time:", incidentTime);
    setCautionText("");
    setIncidentTime("");
  };

   return (
      <div className="min-h-[calc(100vh-4rem)] w-full bg-slate-50/60">
        <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
          {!selectedStudent ? (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Search size={16}/> Teacher Console</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Search student by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                {filteredStudents.length > 0 ? (
                  <div className="space-y-2">
                    {filteredStudents.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-xl border p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
                        onClick={() => setSelectedStudent(s)}
                      >
                        <span>{s.name}</span>
                        <Badge variant="outline">{s.tier}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No students found.</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{selectedStudent.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2"><b>Tier:</b> {selectedStudent.tier}</p>
                <p className="text-sm mb-2"><b>Interventions:</b></p>
                <ul className="list-disc list-inside text-sm mb-4">
                  {selectedStudent.interventions.map((intv, idx) => (
                    <li key={idx}>{intv}</li>
                  ))}
                </ul>

                <p className="text-sm mb-2 font-medium">Caution Note</p>
                <textarea
                  value={cautionText}
                  onChange={(e) => setCautionText(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm mb-3"
                  rows="3"
                  placeholder="Enter caution details..."
                />
                <input
                  type="text"
                  value={incidentTime}
                  onChange={(e) => setIncidentTime(e.target.value)}
                  placeholder="Time of incident (e.g. 09/25/2025 10:15 AM)"
                  className="w-full rounded-lg border px-3 py-2 text-sm mb-3"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveCaution}>Save Caution</Button>
                  <Button variant="outline" onClick={() => setSelectedStudent(null)}>Back to Search</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

