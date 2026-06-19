# Theming JupyPress

## CSS Variables Reference

JupyPress uses CSS custom properties (variables) for theming. The following variables are available for customization:

### Color Palette

```css
:root {
  --color-primary: #e63946;
  --color-primary-soft: rgba(230, 57, 70, 0.1);
  
  --color-text-primary: rgba(0, 0, 0, 0.87);
  --color-text-secondary: rgba(0, 0, 0, 0.60);
  
  --color-background: #ffffff;
  --color-background-alt: #f5f5f5;
  
  --color-border: rgba(0, 0, 0, 0.12);
}
```

### Letterbox

```css
:root {
  --letterbox-bg: #1a1a2e;
}
```

### UI Controls

```css
:root {
  --ui-btn-color: rgba(0, 0, 0, 0.35);
  --ui-btn-hover: rgba(0, 0, 0, 0.7);
  --ui-btn-bg: rgba(255, 255, 255, 0.6);
  --ui-btn-bg-hover: rgba(255, 255, 255, 0.85);
  --ui-btn-inline-hover: rgba(0, 0, 0, 0.06);
  
  --ui-toolbar-bg: rgba(255, 255, 255, 0.7);
  --ui-toolbar-border: rgba(0, 0, 0, 0.08);
  
  --ui-progress-color: rgba(0, 0, 0, 0.65);
}
```

### Slide Picker

```css
:root {
  --picker-bg: rgba(255, 255, 255, 0.97);
  --picker-border: rgba(0, 0, 0, 0.12);
  --picker-text: rgba(0, 0, 0, 0.75);
  --picker-hover: rgba(0, 0, 0, 0.06);
  --picker-num-bg: rgba(0, 0, 0, 0.06);
}
```

## Creating a Custom Theme

1. Create a CSS file with your custom variables:

```css
:root[data-theme="my-theme"] {
  --color-primary: #1976d2;
  --letterbox-bg: #f0f0f0;
  --color-text-primary: #333;
  /* ... more variables ... */
}
```

2. Save the theme in notebook metadata or upload to the server

3. Apply the theme when exporting

## Dark Mode

The presentation supports dark mode via `data-theme="dark"` attribute:

```css
[data-theme="dark"] {
  --letterbox-bg: #121212;
  --color-background: #1e1e1e;
  --color-text-primary: #e0e0e0;
  /* ... */
}
```
