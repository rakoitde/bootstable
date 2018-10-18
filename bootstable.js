/*
Bootstable
 @description  Javascript library to make HMTL tables editable, using Bootstrap 4
 @forked from t-edson/bootstable (Tito Hinostroza)
 
 
*/
  "use strict";
  //Global variables
  var params = null;  		// Parameters
  var colsEdi = [];       // columns that should be editable 
  var newColHtml = '<div class="btn-group">'+
		'<button type="button" class="btn btn-sm btn-outline-dark btnEdit" onclick="rowEdit(this);">' +
		'<span class="oi oi-pencil"></span>'+
		'</button>'+
		'<button type="button" class="btn btn-sm btn-outline-dark btnDelete" onclick="rowDelete(this);">' +
		'<span class="oi oi-trash"></span>'+
		'</button>'+
		'</div><div class="btn-group">'+
		'<button type="button" class="btn btn-sm btn-outline-dark btnAccept" style="display:none;" onclick="rowAccept(this);">' + 
		'<span class="oi oi-check"></span>'+
		'</button>'+
		'<button type="button" class="btn btn-sm btn-outline-dark btnCancel" style="display:none;" onclick="rowCancel(this);">' + 
		'<span class="oi oi-x"></span>'+
		'</button>'+
    '</div>';
  var colEdicHtml = '<td name="buttons">'+newColHtml+'</td>'; 
    
  $.fn.SetEditable = function (options) {
    var defaults = {
        ColumnsEditable: null,      // Index to editable columns. If null all td editable. Ex.: "1,2,3,4,5"
        addButton: null,        	// Jquery object of "Add" button
		NewRowOnBottom: false,		// Append or Prepend new Row
		ButtonColumnHeader: '', 	// Header of the new Button Column 
        onEdit: function() {},   	// Called after edition
		onCancel: function() {},	// Called after cancel
		onBeforeDelete: function(){ // Called before deletion
			return confirm("delete row?"); }, 
        onDelete: function() {}, 	// Called after deletion
        onAdd: function() {}     	// Called when added a new row
    };
    params = $.extend(defaults, options);
    this.find('thead tr').append('<th name="buttons">'+params.ButtonColumnHeader+'</th>');  // Button Column Header
    this.find("tbody tr[data-not-editable!='']").append(colEdicHtml);
	this.find("tbody tr[data-not-editable]").append("<td></td>");
	var $table = this;   // Read reference to the current table, to resolve "this" here.
	
    //Process "addButton" parameter
    if (params.addButton != null) {
        // Parameter was provided
        params.addButton.click(function() {
            rowAddNew($table);
        });
    }
	
    //Process "columnsEd" parameter
    if (params.ColumnsEditable != null) {
        // Extract fields
        colsEdi = params.ColumnsEditable; // params.columnsEd.split(',');
		console.log(colsEdi);
    } else {
		var $cols = this.find('thead tr th');
		var n = 0;
		$cols.each(function() {
			// Check th if data-not-editable is set
			if (typeof $(this).attr('data-not-editable') == 'undefined') {
				colsEdi.push(n.toString());;
			}
			n++;
		});
		console.log(colsEdi);
	}
  };
function IterarCamposEdit($cols, tarea) {
	// repeat for the editable fields of a row
    var n = 0;
    $cols.each(function() {
        n++;
        if ($(this).attr('name')=='buttons') return;  // excludes button column
        if (!isEditable(n-1)) return;   // no fieds editable
        tarea($(this));
    });
    
    function isEditable(idx) {
		// Indicates if the last column is set to be editable
        if (colsEdi==null) {  // it was not defined
			
            return true;  // all are editable
        } else {  // there are fields filter
            for (var i = 0; i < colsEdi.length; i++) {
              if (idx == colsEdi[i]) return true;
            }
            return false;  // It was not found
        }
    }
}
function changeModeNormal(button) {
    $(button).parent().parent().find('.btnAccept').hide();
    $(button).parent().parent().find('.btnCancel').hide();
    $(button).parent().parent().find('.btnEdit').show();
    $(button).parent().parent().find('.btnDelete').show();
    var $row = $(button).parents('tr');  // access the row
    $row.removeClass('editing new');  	 // remove mark
    // Enable addButton on normal
    if (params.addButton != null) {
        params.addButton.prop("disabled",false);
    }
}
function changeModeEdit(button) {
    $(button).parent().parent().find('.btnAccept').show();
    $(button).parent().parent().find('.btnCancel').show();
    $(button).parent().parent().find('.btnEdit').hide();
    $(button).parent().parent().find('.btnDelete').hide();
    var $row = $(button).parents('tr');  // access the row
    $row.addClass('editing');  // indicates that it is in edition
    // Disable addButton on edit
    if (params.addButton != null) {
        params.addButton.prop("disabled",true);
    }
}
function ModoEdicion($row) {
    if ($row.hasClass('editing')) {
        return true;
    } else {
        return false;
    }
}
function rowAccept(button) {	// Accept changes to the edition
    var $row = $(button).parents('tr');  // access the row
    var $cols = $row.find('td');  // read fields
	var $values = {};  // store values
	
    if (!ModoEdicion($row)) return;  // It is already in edition
    // It is in edition. The edition must be finalized
    IterarCamposEdit($cols, function($td) {  // iterate through the columns
	  var key = $td.find('input').attr('id')
      var cont = $td.find('input').val(); // read input content
      $td.html(cont);  // fixes content and removes controls
    });
    changeModeNormal(button);
	
	$cols.each(function(cellIndex) {
		if ($(this).attr('name')!='buttons') {
			var $field = $(this).data()['field']; // read td data-field attribute
			if (!$field) { $field = cellIndex; } // use cellIndex if data-field not exists
			
			$values[$field] = $(this).html();

		}
	})
	
    params.onEdit( $values ); // return json of changed data JSON.stringify(
}
function rowCancel(button) { // Reject changes to the edition
	
	var $row = $(button).parents('tr');  // access the row
	
	if ( $row.hasClass('new') ) {
		$row.remove(); 				     // remove row when row is new
	} else {
		var $cols = $row.find('td');     // read fields
		if (!ModoEdicion($row)) return;  // It is already in edition
		// It is in edition. The edition must be finalized
		IterarCamposEdit($cols, function($td) {  // iterate through the columns
			var cont = $td.find('div').html(); // read div content
			$td.html(cont);  // fixes content and removes controls
		});
		
		params.onCancel($row);
	}
	
	changeModeNormal(button);
}
function rowEdit(button) {  // Start editing a row
    var $row = $(button).parents('tr');  // access the row
    var $cols = $row.find('td');  // read fields
    if (ModoEdicion($row)) return;  // It is already in edition
    // Put in edit mode
    IterarCamposEdit($cols, function($td) {  // iterate through the columns
        var cont = $td.html(); // read content
        var div = '<div style="display: none;">' + cont + '</div>';  // save content
        var input = '<input class="form-control form-control-sm"  value="' + cont + '">';
        $td.html(div + input);  // fixed content
    });
    changeModeEdit(button);
}
function rowDelete(button) {  // Delete the current row
    var $row = $(button).parents('tr');  // access the row
	var $cols = $row.find('td');  // read fields
    var $return =  params.onBeforeDelete($row);
	var $values = {};  // store values

	$cols.each(function(cellIndex) {
		if ($(this).attr('name')!='buttons') {
			var $field = $(this).data()['field']; // read td data-field attribute
			if (!$field) { $field = cellIndex; } // use cellIndex if data-field not exists
			
			$values[$field] = $(this).html();
		}
	})
	
	if ($return != false) {
		$row.remove();
		params.onDelete($values);
	}
}
function rowAddNew($table) {  // Add row to the indicated table.

	// Check if no row is in edit mode
	if ( !$('.new').length ) {

        var $row = $table.find('thead tr');  // header
        var $cols = $row.find('th');  // read fields
		
        // build html
        var htmlDat = '';
        $cols.each(function() {
            if ($(this).attr('name')=='buttons') {
                // It is column of buttons
                htmlDat = htmlDat + colEdicHtml;  // add buttons
            } else {
				var datafield = $(this).data('field');
                htmlDat = htmlDat + '<td data-field="'+datafield+'"></td>';
            }
        });
		
		// append or prepend new row
		if (params.NewRowOnBottom) {
			$table.find('tbody').append('<tr class="new">'+htmlDat+'</tr>');
		} else {
			$table.find('tbody').prepend('<tr class="new">'+htmlDat+'</tr>');
		}
		
		// start editing
		$('.new').find('.btnEdit').click()

		params.onAdd();
			
	}
}
