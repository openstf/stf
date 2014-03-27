# nice-tabs

This are nice tabs. They wrap:
- Angular Bootstrap tabs
- Feature Font Awesome icon support
- Load and preload templates for each tab
- Save last selected tab to localForage
- Support tab show/hide (?)





### Current syntax
```html
<nice-tabs key='ControlBottomTabs' direction='below' tabs='tabs'></nice-tabs>
```

```javascript
function Ctrl($scope) {
	$scope.tabs = [
    	{title: 'Tab One', icon: 'fa-bolt', templateUrl='terminal/tab-one.jade'},
    	{title: 'Tab One', icon: 'fa-bolt', templateUrl='terminal/tab-one.jade'},
	]
}
```

### Declarative syntax (future):
```html
<nice-tabs key='ControlBottomTabs' direction='below'>
      <nice-tab title='Tab One' icon='fa-bolt' templateUrl='"terminal/tab-one.jade"'></nice-tab>
      <nice-tab title='Tab Two' icon='fa-bolt' templateUrl='"terminal/tab-two.jade"' ng-show='showOtherTabs'></nice-tab>
</nice-tabs>
```
