import React, { useEffect, useState } from "react";
import { User, Mail, Phone, MapPin, Search, Plus, Trash2, Edit2, Globe } from "lucide-react";
import { Card, CardHeader, CardContent } from "./Card";
import { SavedCustomer, SavedSupplier } from "../types";
import { Button } from "./Button";
import { Input } from "./Input";
import { validateGSTIN, validateEmail, validatePhone, validateRequired } from "../lib/validation";
import { COUNTRIES, getCountryConfig } from "../utils/localization";

interface PartyListProps {
  title: string;
  parties: (SavedCustomer | SavedSupplier)[];
  onRemove: (id: string) => void;
  onAdd: (party: any) => void;
  onUpdate: (party: any) => void;
  type: "customer" | "supplier";
  taxLabel?: string;
  sellerCountry?: string;
}

export const PartyList = ({ title, parties, onRemove, onAdd, onUpdate, type, taxLabel = "Tax ID / GSTIN", sellerCountry = "India" }: PartyListProps) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);
  const [editingParty, setEditingParty] = React.useState<any | null>(null);
  const [newParty, setNewParty] = React.useState({
    name: "",
    gstin: "",
    address: "",
    country: sellerCountry,
    phone: "",
    email: "",
    contactPerson: "",
    notes: "",
    terms: ""
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    if (isAdding) {
      setErrors({
        name: validateRequired(newParty.name, "Name"),
        address: validateRequired(newParty.address, "Address"),
        gstin: validateGSTIN(newParty.gstin),
        phone: validatePhone(newParty.phone),
        email: validateEmail(newParty.email)
      });
    }
  }, [newParty, isAdding]);

  const filteredParties = parties.filter(p => {
    const term = (searchTerm || "").toLowerCase();
    const name = (p.name || "").toLowerCase();
    const gstin = (p.gstin || "").toLowerCase();
    const country = (p.country || "").toLowerCase();
    return name.includes(term) || gstin.includes(term) || country.includes(term);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation check
    const hasErrors = Object.values(errors).some(error => error !== undefined);
    if (hasErrors) return;
    if (!newParty.name || !newParty.address) return;
    
    const isOverseas = (newParty.country || sellerCountry).toLowerCase().trim() !== sellerCountry.toLowerCase().trim();
    const partyData = { ...newParty, isExport: isOverseas };

    if (editingParty) {
      onUpdate({ ...partyData, id: editingParty.id });
    } else {
      onAdd({ ...partyData, id: Date.now().toString() });
    }
    
    setNewParty({ name: "", gstin: "", address: "", country: sellerCountry, phone: "", email: "", contactPerson: "", notes: "", terms: "" });
    setIsAdding(false);
    setEditingParty(null);
    setErrors({});
  };

  const handleEdit = (party: any) => {
    setEditingParty(party);
    setNewParty({
      name: party.name,
      gstin: party.gstin || "",
      address: party.address,
      country: party.country || sellerCountry,
      phone: party.phone || "",
      email: party.email || "",
      contactPerson: party.contactPerson || "",
      notes: party.notes || "",
      terms: party.terms || ""
    });
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingParty(null);
    setNewParty({ name: "", gstin: "", address: "", country: sellerCountry, phone: "", email: "", contactPerson: "", notes: "", terms: "" });
    setErrors({});
  };

  if (isAdding) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">
              {editingParty ? "Edit" : "Add New"} {type === "customer" ? "Customer" : "Supplier"}
            </h2>
            <p className="text-sm text-zinc-500">
              {editingParty ? "Update details for this party" : "Enter the details of the new party"}
            </p>
          </div>
          <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Name" 
                  value={newParty.name} 
                  onChange={(e) => setNewParty({ ...newParty, name: e.target.value })}
                  placeholder="Company Name"
                  required
                  error={errors.name}
                />
                <Input 
                  label={taxLabel} 
                  value={newParty.gstin} 
                  onChange={(e) => setNewParty({ ...newParty, gstin: e.target.value })}
                  placeholder="Optional"
                  error={errors.gstin}
                />
                <div className="md:col-span-2">
                  <Input 
                    label="Address" 
                    value={newParty.address} 
                    onChange={(e) => setNewParty({ ...newParty, address: e.target.value })}
                    placeholder="Full Address"
                    required
                    error={errors.address}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Country</label>
                  <select
                    value={newParty.country || sellerCountry}
                    onChange={(e) => setNewParty({ ...newParty, country: e.target.value })}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 font-semibold text-zinc-800"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Input 
                  label="Phone" 
                  value={newParty.phone} 
                  onChange={(e) => setNewParty({ ...newParty, phone: e.target.value })}
                  placeholder="Contact Number"
                  error={errors.phone}
                />
                <Input 
                  label="Email" 
                  type="email"
                  value={newParty.email} 
                  onChange={(e) => setNewParty({ ...newParty, email: e.target.value })}
                  placeholder="Email Address"
                  error={errors.email}
                />
                {type === "customer" && (
                  <Input 
                    label="Contact Person" 
                    value={newParty.contactPerson} 
                    onChange={(e) => setNewParty({ ...newParty, contactPerson: e.target.value })}
                    placeholder="Optional"
                  />
                )}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Default Terms & Conditions</label>
                  <textarea 
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-zinc-900/5 resize-y"
                    placeholder="Add standard terms and conditions for this client..."
                    value={newParty.terms}
                    onChange={(e) => setNewParty({ ...newParty, terms: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Default Notes / Instructions</label>
                  <textarea 
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-zinc-900/5 resize-y"
                    placeholder="Add default notes or instructions for this client..."
                    value={newParty.notes}
                    onChange={(e) => setNewParty({ ...newParty, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={Object.values(errors).some(error => error !== undefined)}>
                  {editingParty ? "Update" : "Save"} {type === "customer" ? "Customer" : "Supplier"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">{title}</h2>
          <p className="text-sm text-zinc-500">Manage your saved {type}s</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-full sm:w-64">
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${type}s...`}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add {type === "customer" ? "Customer" : "Supplier"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParties.length > 0 ? (
          filteredParties.map((party) => (
            <Card key={party.id} className="group hover:border-zinc-300 transition-colors">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
                    <User className="text-zinc-600 h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEdit(party)}
                      className="text-zinc-400 hover:text-brand-600 hover:bg-brand-50"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onRemove(party.id)}
                      className="text-zinc-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <h3 className="font-bold text-lg text-zinc-900 mb-1">{party.name}</h3>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">{taxLabel}: {party.gstin || "N/A"}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-lg w-fit">
                    <Globe className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{getCountryConfig(party.country || sellerCountry).flag}</span>
                    <span>{party.country || sellerCountry}</span>
                    {(party.country || sellerCountry).toLowerCase().trim() !== sellerCountry.toLowerCase().trim() && (
                      <span className="ml-1 text-[10px] font-black uppercase text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">
                        Overseas
                      </span>
                    )}
                  </div>
                  {party.phone && (
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <Phone className="h-3 w-3" />
                      <span>{party.phone}</span>
                    </div>
                  )}
                  {party.email && (
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <Mail className="h-3 w-3" />
                      <span>{party.email}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-sm text-zinc-600">
                    <MapPin className="h-3 w-3 mt-1 shrink-0" />
                    <span className="line-clamp-2">{party.address}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white border border-dashed border-zinc-200 rounded-2xl">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center">
                <User className="text-zinc-200 h-8 w-8" />
              </div>
              <div>
                <p className="font-bold text-zinc-900">No {type}s found</p>
                <p className="text-sm text-zinc-500">Parties are automatically saved when you generate documents.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
