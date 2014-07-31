# enable-autofill

This directive enables autofill (HTML5 autocomplete) on the selected form.

Currently this is only needed in `Chrome` because `autofill` only works on form `POST` method.

Based on [this](http://stackoverflow.com/questions/16445463/how-to-get-chrome-to-autofill-with-asynchronous-post/22191041#22191041).

## Usage

```html
<form enable-autofill action="about:blank">
	<input type="text" autocomplete="on">
</form>  
```

This will create the following DOM:

```html
<iframe src="about:blank" name="_autofill" style="display:none">
<form method="post" action="about:blank" target="_autofill">
	<input type="text" autocomplete="on">
</form>  
```

Yes, it is a bit ugly but it is currently the only way. 

It will create only one `iframe` which will be reused.