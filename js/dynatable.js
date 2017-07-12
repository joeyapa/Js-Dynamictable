/**	 
 *
 */

function Dynatable ( tabledata ) {
	this.root = $( tabledata.root );
	this.selectedrow = false;
	this.tabledata = tabledata

	// check if there is an existing table
	if(this.root.find('table').length) {
		this.root.find('table tr.update').remove();
	}
	else {
		var s = '<table class="table table-striped table-condensed"><tr class="header">';
		for(var i=0;i<tabledata.column.length;i++) {
			s += '<th>'+tabledata.column[i].id+'</th>';
		}
		s += '<th>ACTION</th></tr></table>';	
		this.root.append(s);
	}

	
}

Dynatable.getrowdata = function( row ) {
	var r = row.find('input[type=text], input[type=hidden], select, textarea');
	var d = '';					
	for(i=0;i<r.length;i++){
		var e = $(r[i]);
		d=d+e.attr('name')+"="+e.val()+"&";
	}
	return d;
}

Dynatable.prototype.build = function() {
	// create the table entry
	this.addrows();

	// define the edit / save button
	this.addeditEvent();

	// define the remove button
	this.addremoveEvent();

	// pagination
	this.addpagination();
}


Dynatable.prototype.addrows = function() {
	var self = this;
	var r = self.tabledata;

	for(var i=0;i<r.data.length;i++){
		var ob = r.data[i];
		var s = '<tr class="update">';
		
		for(var j=0;j<r.column.length;j++){
			var sj = '';
			if( r.column[j].type == 'text' ) {
				sj = '<input type="text" name="'+r.column[j].id+'" value="'+ob[r.column[j].id]+'" class="form-control readonly" readonly>';
			}
			else if( r.column[j].type == 'textarea' ) {
				sj = '<textarea name="'+r.column[j].id+'" class="form-control readonly" readonly>'+ob[r.column[j].id]+'</textarea>';
			}
			else if( r.column[j].type == 'select' ) {
				var st = $('<td><select name="'+r.column[j].id+'" class="form-control readonly" disabled>'+r.column[j].option+'</select></td>');
				st.find('select option[value="'+ob[r.column[j].id]+'"]').attr("selected",true)
				sj = st.html();
			}
			else if( r.column[j].type == 'hide' ) {
				sj = '<input type="hidden" name="'+r.column[j].id+'" value="'+ob[r.column[j].id]+'">';
			}
			else {
				sj = '<label>'+ob[r.column[j].id]+'</label><input type="hidden" name="'+r.column[j].id+'" value="'+ob[r.column[j].id]+'" class="form-control readonly" readonly>';
			}

			if( r.column[j].pk === true ) {
				sj = sj + '<input type="hidden" name="pk" value="'+ob[r.column[j].id]+'">';
			}

			if( r.column[j].type == 'hide' ) {
				s = s + '<td class="hide">' + sj + '</td>';
			}
			else {
				s = s + '<td>' + sj + '</td>';	
			}

			
		}
		s = s + '<td><input type="button" class="btn btn-info edit" value="Edit">&nbsp;<input type="button" class="btn btn-warning remove" value="Remove"></td></tr>';

		this.root.find('table').append(s);
		this.root.find('table').data('tabledata',r);

	}
};

Dynatable.prototype.addpagination = function() {
	var self = this;
	var r = self.tabledata;


	self.root.find('ul.pagination').empty();

	if( r.tp <= 5 ) {
		for(var i=1;i<=r.tp;i++) {
			var s = $( '<li'+ (i==r.cp?' class="active"':'') +'><a target-page="'+i+'">'+i+'</a></li>' );
			self.root.find('ul.pagination').append(s);
		}
	}
	else { // 2 pages before and 2 pages after. ensure that there are always 5 pages.
		if( r.cp>=4 ) { self.root.find('ul.pagination').append('<li><a target-page="1">First</a></li>'); }

		var sp = Math.max(1, r.cp-2);
		var mp = Math.max(5, r.cp+2 > r.tp ? r.tp : r.cp+2);
		sp = (mp-sp)<5?mp-4:sp;

		for(var i=sp;i<=mp;i++) {
			var s = $( '<li'+ (i==r.cp?' class="active"':'') +'><a target-page="'+i+'">'+i+'</a></li>' );					
			self.root.find('ul.pagination').append(s);
		}

		if( r.cp<r.tp-2 ) { self.root.find('ul.pagination').append('<li><a target-page="'+r.tp+'">Last</a></li>'); }
	}

	self.root.find('ul.pagination a').click(function(){
		var data = {'el':$(this),'page': $(this).attr('target-page')}
		self.callbackPageLink( data );
	});
};

Dynatable.prototype.addeditEvent = function() {
	var self = this;

	this.root.find('input[type=button].edit').click(function(e){ 
		e.preventDefault();	
		var row = $(this).parents('tr:first');				
		var data = Dynatable.getrowdata( row ) + 'p='+self.tabledata.cp+'&';

		if( row.attr('state')==='save' ) {
			self.modal({m:'Continue to save changes?',bcc:'btn-info',bct:'Save'}, function(){
				self.callbackSaveBtn( row, data );  	
			});
		}
		else if( row.attr('state')==='edit' ) {
			self.callbackEditBtnBlur( row, data );
		}
		else {
			self.callbackEditBtn( row, data );
		}

		self.enablerowform( row, 
			function(row){ 
				row.attr('state','save');
				row.find('input.edit').val("Save"); 
			}, 
			function(row){  
				row.attr('state','edit');
				row.find('input.edit').val('Edit');  
			}
		);

	});
};

Dynatable.prototype.reseteditRow = function( row ) {
	row.find('input.edit').val('Edit');  
	row.removeAttr('state');

};

Dynatable.prototype.addremoveEvent = function() {
	var self = this;

	this.root.find('input[type=button].remove').click(function(e){				
		e.preventDefault();
		var row = $(this).parents('tr:first');
		var data = Dynatable.getrowdata( row ) + 'p='+self.tabledata.cp+'&';

		self.modal({m:'Continue to remove row?',bcc:'btn-danger',bct:'Remove'}, function(){
			self.callbackRemoveBtn( row, data );
		});
		
	});	
};

Dynatable.prototype.enablerowform = function(row, cb=function(){}, cbd=function(){} ) {
	var self = this;
	if( self.selectedrow !== false ) {
		self.disablerowform( self.selectedrow, cbd );
	}

	var r = row.find('input[type=text] , select');
	for(i=0;i<r.length;i++){
		var e = $(r[i]);
		e.removeAttr('disabled').removeAttr('readonly').removeClass('readonly');
	}				

	self.selectedrow = row;

	cb(row);
};

Dynatable.prototype.disablerowform = function(tr, cb=function(){} ) {
	var r = $(tr).find('input[type=text]');
	for(i=0;i<r.length;i++){
		var e = $(r[i]);
		e.attr('readonly','readonly');
		e.addClass('readonly');
	}
	r = $(tr).find('select');
	for(i=0;i<r.length;i++){
		var e = $(r[i]);
		e.attr('disabled','disabled');
		e.addClass('readonly');
	}
	cb(tr);
};

Dynatable.prototype.modal = function(d={m:'',bcc:'',bct:''},cb=function(){}) {
	var self = this;
	var p = '<div id="dynatable-modal" class="modal fade" role="dialog"><div class="modal-dialog"><div class="modal-content"><div class="modal-body"><p>{m}</p></div><div class="modal-footer"><button type="button" class="btn {bcc} confirm-action">{bct}</button><button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button></div></div></div></div>';

	p = p.replace('{m}',d.m).replace('{bcc}',d.bcc).replace('{bct}',d.bct);
	
	self.root.append( p );

	self.root.find( '#dynatable-modal' ).modal();
	self.root.find( '#dynatable-modal' ).on("hidden.bs.modal", function () {
		self.root.find( '#dynatable-modal' ).remove();
	});
	self.root.find( '#dynatable-modal button.confirm-action' ).click(function(){
		cb();
		self.root.find( '#dynatable-modal' ).modal('hide');
	});
	
};		

Dynatable.prototype.progressShow = function() {
	var self = this;

	var p = '<div id="dynatable-progress-modal" class="modal fade" role="dialog"><div class="modal-dialog"><div class="modal-content"><div class="modal-body"><p>Processing request</p><div class="progress"><div class="progress-bar" role="progressbar" aria-valuenow="5" aria-valuemin="0" aria-valuemax="100" style="width:5%">5%</div></div></div></div></div></div>';

	self._progressInterval = setInterval(function(){
		var ps = self.root.find( '#dynatable-progress-modal div.progress-bar' );
		var val = ps.attr('aria-valuenow');
		val++;
		if( val < 97 ) {
			ps.attr('aria-valuenow',val); ps.width(val+'%'); ps.html(val+'%');	
		}
		
	},100);

	self.root.append( p );

	self.root.find( '#dynatable-progress-modal' ).modal( {backdrop: 'static', keyboard: false} );

	self.root.find( '#dynatable-progress-modal' ).on("hidden.bs.modal", function () {
		self.root.find( '#dynatable-progress-modal' ).remove();
	});

};

Dynatable.prototype.progressHide = function(cb=function(){ }) {
	var self = this;			
	clearInterval( self._progressInterval );
	var ps = self.root.find( '#dynatable-progress-modal div.progress-bar' );
	self.root.find( '#dynatable-progress-modal div.modal-body p' ).html('Processing complete');
	var val = 100;
	ps.attr('aria-valuenow',val); ps.width(val+'%'); ps.html(val+'%');	
	setTimeout(function(){				
		self.root.find( '#dynatable-progress-modal' ).modal('hide');	
		cb();
	},1000);
	
};		

Dynatable.prototype.callbackEditBtn = function( dy, row ) { }

Dynatable.prototype.callbackEditBtnBlur = function( dy, row ) { }

Dynatable.prototype.callbackSaveBtn = function( dy, row ) { }

Dynatable.prototype.callbackRemoveBtn = function( dy, row ) { }

Dynatable.prototype.callbackPageLink = function( dy, row ) { }
