---
layout: default
---

## Download

Download the latest release of Leaflet Routing Machine:

<small>
_Note:_ If you're using Leaflet's 1.0.0 beta release, you need to use a beta release of Leaflet Routing Machine as well. Please download or install version 3.0.0-beta.1 of Leaflet Routing Machine in this case; version 2 will _only_ work
with Leaflet 0.7.
</small>

{% for version in site.data.versions reversed %}
* [leaflet-routing-machine-{{ version.version }}.zip]({{site.baseurl}}/dist/leaflet-routing-machine-{{ version.version }}.zip)
{% endfor %}

These distributions include files that can be loaded with a normal `<script>` tag in your page.

## Install

You can also install Leaflet Routing Machine using NPM, and use it with for example Browserify:

```
npm install --save leaflet-routing-machine
```

## Using


Include `leaflet-routing-machine.css` and `leaflet-routing-machine.js` in a Leaflet page:

<pre><code class="language-markup">[...]
&lt;link rel=&quot;stylesheet&quot; href=&quot;http://cdn.leafletjs.com/leaflet-0.7.3/leaflet.css&quot; /&gt;
&lt;link rel=&quot;stylesheet&quot; href=&quot;leaflet-routing-machine.css&quot; /&gt;
&lt;script src=&quot;http://cdn.leafletjs.com/leaflet-0.7.3/leaflet.js&quot;&gt;&lt;/script&gt;
&lt;script src=&quot;leaflet-routing-machine.js&quot;&gt;&lt;/script&gt;
</code></pre>
