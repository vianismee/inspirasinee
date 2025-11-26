```html
<div class="w-full max-w-md">
  <div
    class="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
  >
    <div class="p-8 text-center bg-gradient-to-b from-green-50 to-white">
      <div
        class="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-sm bg-green-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-package h-10 w-10 text-green-600"
          aria-hidden="true"
        >
          <path
            d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"
          ></path>
          <path d="M12 22V12"></path>
          <polyline points="3.29 7 12 12 20.71 7"></polyline>
          <path d="m7.5 4.27 9 5.15"></path>
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 mb-1">Dummy Drop Point</h1>
      <div
        class="flex items-center justify-center gap-2 text-gray-500 text-sm mb-4"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-map-pin h-3 w-3"
          aria-hidden="true"
        >
          <path
            d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
          ></path>
          <circle cx="12" cy="10" r="3"></circle></svg
        >Jl. Dummy No. 123, Jakarta
      </div>
      <span
        data-slot="badge"
        class="inline-flex items-center justify-center border w-fit whitespace-nowrap shrink-0 [&amp;&gt;svg]:size-3 gap-1 [&amp;&gt;svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden border-transparent text-primary-foreground [a&amp;]:hover:bg-primary/90 px-4 py-1.5 text-sm font-medium rounded-full bg-green-600 hover:bg-green-700"
        >Open for Drop-off</span
      >
    </div>
    <div class="px-8 pb-8">
      <div class="grid grid-cols-2 gap-4 mb-8">
        <div
          class="bg-gray-50 rounded-2xl p-5 text-center border border-gray-100"
        >
          <div class="text-3xl font-bold text-gray-900 mb-1">30</div>
          <div
            class="text-xs text-gray-500 uppercase tracking-wide font-semibold"
          >
            Slots Left
          </div>
        </div>
        <div
          class="bg-gray-50 rounded-2xl p-5 text-center border border-gray-100"
        >
          <div class="text-3xl font-bold text-gray-400 mb-1">
            0<span class="text-lg font-normal text-gray-300">/30</span>
          </div>
          <div
            class="text-xs text-gray-500 uppercase tracking-wide font-semibold"
          >
            Occupied
          </div>
        </div>
      </div>
      <button
        data-slot="button"
        class="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive text-primary-foreground px-4 py-2 has-[&gt;svg]:px-3 w-full h-14 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 bg-blue-600 hover:bg-blue-700"
      >
        Start Drop-Off
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-arrow-right ml-2 h-5 w-5"
          aria-hidden="true"
        >
          <path d="M5 12h14"></path>
          <path d="m12 5 7 7-7 7"></path>
        </svg>
      </button>
      <div
        class="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400"
      >
        <div class="flex items-center gap-1">
          <div class="w-2 h-2 rounded-full bg-blue-500"></div>
          Standard 35k
        </div>
        <div class="flex items-center gap-1">
          <div class="w-2 h-2 rounded-full bg-green-500"></div>
          White +5k
        </div>
      </div>
    </div>
  </div>
  <div class="text-center mt-6">
    <button
      data-slot="button"
      class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent dark:hover:bg-accent/50 h-8 rounded-md gap-1.5 px-3 has-[&gt;svg]:px-2.5 text-gray-400 hover:text-gray-600"
    >
      Back to Locations
    </button>
  </div>
</div>
```
