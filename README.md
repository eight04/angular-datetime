angular-ezdialog
================

An simple AngularJS dialog service based on $modal of UI Bootstrap

Demo
----
You can check the demo [here](https://rawgit.com/eight04/angular-ezdialog/master/example/example.html).

Usage
-----
```JavaScript
// Pop a simple error
ezdialog.error("error");

// With title
ezdialog.error("error", "Something went wrong");

// Do something after dialog close
ezdialog.error("error").close(function(ret){
    // ok -> true, cencel -> false
    ezdialog.show("dialog closed! returned value: " + ret);
});

// Replace default button click callback
ezdialog.confirm()
    .ok(function(){
        ezdialog.show("OK");
        this.close();
    })
    .cancel(function(){
        ezdialog.show("press Yes to close dialog");
    });

// Make dialog always return true
ezdialog.yesno()
    .cancel(function(
        this.close(true);
    ))
    .close(function(ret){
        ezdialog.show("ret: " + ret);
    });

// Change default settings. It will affect all dialog globally.
ezdialog.conf({
    size: "lg",
    title: {
        show: "show time!"
    }
}).show();

// Call method with options.
ezdialog.show({
    title: "my title",
    msg: "my message",
    size: "md",
    yes: "this is yes button text",
    no: "and this is no button text"
});

// Use a custom template. Template will be include in dialog body.
ezdialog.show({
	title: "use template",
	template: "my-dialog.html"
});
```

Methods
-------
```JavaScript
// there are 5 methods to display dialog
ezdialog.error()
ezdialog.show()
ezdialog.confirm()
ezdialog.yesno()	// same as confirm, but button text setted as Yes/No instead of OK/Cancel.

// these methods will return a dialog object. You can provide some callbacks.
// Note that you have to call this.close() in ok/cancel callback to close dialog.
dialog.confirm()
	.ok(func)		// call when click on ok button
	.cancel(func)	// call when click on cancel button
	.close(func)	// after dialog close.
```

Options
-------
```JavaScript
// Default config. Define default button text, title, message...
// Change it with dialog.conf()
var conf = {
	btn: {
		ok: "OK",
		cancel: "Cancel",
		yes: "Yes",
		no: "No"
	},
	title: {
		show: "Info",
		confirm: "Confirm",
		yesno: "Confirm",
		error: "Error"
	},
	msg: {
		show: "Hi!",
		confirm: "Are you sure?",
		yesno: "Yes or no?",
		error: "An error occurred!"
	},
	size: 'sm',
	backdrop: 'static'
};

// full option list you can pass to dialog's method
var opt = {
	title: "title",
	msg: "message",

	// button text
	yes: "OK",
	no: "Cancel",

	// dialog type. primary|success|info|warning|danger
	type: "primary",

	// dialog size. sm|md|lg
	size: "sm"

	// dialog backdrop. true|false|static
	backdrop: "static",

	// dialog template. will be place in dialog body.
	// message will be hide if template successfully loaded.
	template: "template.html"
};
```

Todos
-----
* Enhance enter key press behavior.