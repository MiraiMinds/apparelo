// Copyright (c) 2019, Aerele Technologies Private Limited and contributors
// For license information, please see license.txt

frappe.ui.form.on('DC', {
	onload: function(frm) {
		frm.set_value("company",frappe.defaults.get_default("company"));
		frm.set_query("supplier", function() {
			return {
				query: "apparelo.apparelo.doctype.dc.dc.get_supplier",
				filters: {
					"supplier_process.processes": frm.doc.process_1
				}
			};
		});
		frm.set_query("supplier_address_name", function() {
			return {
				filters: {
					"link_doctype": "Supplier",
					"link_name": frm.doc.supplier
				}
			}
		});
		frm.set_query("company_address_name", function() {
			return {
				filters: {
					"link_doctype": "Company",
					"link_name": frm.doc.company
				}
			}
		});
	},
	supplier:function(frm){
		if (frm.doc.supplier)
		{
			frappe.call({
				method:"apparelo.apparelo.doctype.dc.dc.get_supplier_based_address",
				args:{supplier: frm.doc.supplier},
				callback: function(r){
					if (r.message){
						frm.set_value("supplier_address_name",r.message)
					}
					else {
						frm.set_value("supplier_address_name","")
					}
				}
			})
		}
		refresh_field('supplier_address_name');
	},
	location:function(frm){
		update_company_address(frm);
		},
	company:function(frm){
		update_company_address(frm);
	},
	company_address_name: function(frm) {
		update_supplier_and_company_address(frm.doc.company_address_name, "company_address");
	},
	supplier_address_name: function(frm) {
		update_supplier_and_company_address(frm.doc.supplier_address_name, "supplier_address");
	},
	
	get_items:function(frm) {
		const items_set_fields =['item_code','available_quantity','primary_uom','secondary_uom','pf_item_code'];
		const return_materials_set_fields = ['item_code', 'uom', 'qty', 'projected_qty', 'secondary_uom', 'additional_parameters', 'pf_item_code', 'bom'];
		frappe.call({
			method: "apparelo.apparelo.doctype.dc.dc.make_dc",
			freeze: true,
			args: {doc: frm.doc},
			callback: function(r) {
				if(r.message) {
					frm.set_value('items', []);
					$.each(r.message.items, function(i, d) {
						var item = frm.add_child('items');
						for (let key in d) {
							if (d[key] && in_list(items_set_fields, key)) {
								item[key] = d[key];
							}
						}
					});

					frm.set_value('return_materials', []);
					$.each(r.message.return_materials, function(i, d) {
						var item = frm.add_child('return_materials');
						for (let key in d) {
							if (d[key] && in_list(return_materials_set_fields, key)) {
								item[key] = d[key];
							}
						}
					});
				}
				refresh_field('items');
				refresh_field('return_materials');
			}
		});
	},
	get_return_item: function(frm) {
		const set_fields = ['item_code', 'uom', 'qty', 'projected_qty', 'secondary_uom', 'additional_parameters', 'pf_item_code', 'bom'];
		frappe.call({
			method: "apparelo.apparelo.doctype.dc.dc.calculate_expected_qty_from_delivery_qty",
			freeze: true,
			args: {
				doc: frm.doc
			},
			callback: function(r) {
				if(r.message) {
					frm.set_value('return_materials', []);
					$.each(r.message, function(i, d) {
						var item = frm.add_child('return_materials');
						for (let key in d) {
							if (d[key] && in_list(set_fields, key)) {
								item[key] = d[key];
							}
						}
					});
				}
				refresh_field('return_materials');
			}
		});

	},
	calculate_delivery_quantity:function(frm) {
		const set_fields =['item_code', 'available_quantity', 'quantity', 'primary_uom', 'secondary_uom', 'secondary_qty', 'pf_item_code'];
		frappe.call({
			method: "apparelo.apparelo.doctype.dc.dc.get_delivery_qty_from_return_materials",
			freeze: true,
			args: {doc: frm.doc},
			callback: function(r) {
				if(r.message) {
					frm.set_value('items', []);
					$.each(r.message, function(i, d) {
						var item = frm.add_child('items');
						for (let key in d) {
							if (d[key] && in_list(set_fields, key)) {
								item[key] = d[key];
							}
						}
					});
				}
				refresh_field('items');
			}
		});
	},
});

var update_company_address = function(frm){
	if (frm.doc.location && frm.doc.company)
	{
		frappe.call({
			method:"apparelo.apparelo.doctype.dc.dc.get_location_based_address",
			args:{location:frm.doc.location, company:frm.doc.company},
			callback: function(r){
				if (r.message){
					frm.set_value("company_address_name",r.message)
				}
				else {
					frm.set_value("company_address_name","")
				}
			}
		})
	}
	refresh_field('company_address_name');
}

var update_supplier_and_company_address = function(address_name,address_field){
	if(address_field) {
		frappe.call({
			method: "frappe.contacts.doctype.address.address.get_address_display",
			args: {"address_dict": address_field},
			callback: function(r) {
				if(r.message) {
					frm.set_value(address_name, r.message.replace(/<\/?[^>]+>/ig, "\n"))
				}
			}
		})
	} else {
		frm.set_value(address_name, "");
	}
	refresh_field(address_name);
}