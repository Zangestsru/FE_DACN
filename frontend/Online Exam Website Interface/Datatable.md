I'm using the FlyonUI Tailwind CSS component library in my project. Please integrate the following component into my project:

Here are the code snippets for the block component: 

```html
<div
  class="bg-base-100 flex flex-col rounded-md shadow-base-300/20 shadow-sm"
  data-datatable='{
  "pageLength": 5,
  "pagingOptions": {
    "pageBtnClasses": "btn btn-text btn-circle btn-sm"
  },
  "selecting": true,
  "rowSelectingOptions": {
    "selectAllSelector": "#table-checkbox-all"
  }
}'
>
  <div class="overflow-x-auto">
    <div class="inline-block min-w-full align-middle">
      <div class="overflow-hidden">
        <table class="table min-w-full">
          <thead>
            <tr>
              <th scope="col" class="--exclude-from-ordering w-3.5 pe-0">
                <div class="flex h-5">
                  <input id="table-checkbox-all" type="checkbox" class="checkbox checkbox-sm" />
                  <label for="table-checkbox-all" class="sr-only">Checkbox</label>
                </div>
              </th>
              <th scope="col" class="group w-fit">
                <div class="flex items-center justify-between">
                  Product Name
                  <span class="icon-[tabler--chevron-up] datatable-ordering-asc:block hidden"></span>
                  <span class="icon-[tabler--chevron-down] datatable-ordering-desc:block hidden"></span>
                </div>
              </th>
              <th scope="col" class="group w-fit">
                <div class="flex items-center justify-between">
                  Price
                  <span class="icon-[tabler--chevron-up] datatable-ordering-asc:block hidden"></span>
                  <span class="icon-[tabler--chevron-down] datatable-ordering-desc:block hidden"></span>
                </div>
              </th>
              <th scope="col" class="group w-fit">
                <div class="flex items-center justify-between">
                  Availability
                  <span class="icon-[tabler--chevron-up] datatable-ordering-asc:block hidden"></span>
                  <span class="icon-[tabler--chevron-down] datatable-ordering-desc:block hidden"></span>
                </div>
              </th>
              <th scope="col" class="--exclude-from-ordering">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-1" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-1" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>Apple iPhone 15</td>
              <td>$999</td>
              <td><span class="badge badge-soft badge-success badge-sm">In Stock</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-2" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-2" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>Samsung Galaxy S23</td>
              <td>$899</td>
              <td><span class="badge badge-soft badge-warning badge-sm">Limited</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-3" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-3" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>Sony WH-1000XM5</td>
              <td>$399</td>
              <td><span class="badge badge-soft badge-error badge-sm">Out of Stock</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-4" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-4" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>Dell XPS 15</td>
              <td>$1,299</td>
              <td><span class="badge badge-soft badge-success badge-sm">In Stock</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-5" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-5" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>Logitech MX Master 3</td>
              <td>$99</td>
              <td><span class="badge badge-soft badge-warning badge-sm">Limited</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-6" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-6" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>Microsoft Surface Laptop 5</td>
              <td>$1,499</td>
              <td><span class="badge badge-soft badge-success badge-sm">In Stock</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-7" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-7" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>HP Spectre x360</td>
              <td>$1,199</td>
              <td><span class="badge badge-soft badge-error badge-sm">Out of Stock</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-8" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-8" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>Apple Watch Series 9</td>
              <td>$499</td>
              <td><span class="badge badge-soft badge-warning badge-sm">Limited</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-9" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-9" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>Google Pixel 7</td>
              <td>$599</td>
              <td><span class="badge badge-soft badge-success badge-sm">In Stock</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-10" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-10" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>Bose QuietComfort Earbuds II</td>
              <td>$279</td>
              <td><span class="badge badge-soft badge-error badge-sm">Out of Stock</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-11" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-11" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>Asus ROG Zephyrus G14</td>
              <td>$1,899</td>
              <td><span class="badge badge-soft badge-success badge-sm">In Stock</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-12" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-12" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>Sony PlayStation 5</td>
              <td>$499</td>
              <td><span class="badge badge-soft badge-warning badge-sm">Limited</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-13" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-13" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>Amazon Echo Dot (5th Gen)</td>
              <td>$49</td>
              <td><span class="badge badge-soft badge-success badge-sm">In Stock</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-14" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-14" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>NVIDIA GeForce RTX 4090</td>
              <td>$1,599</td>
              <td><span class="badge badge-soft badge-warning badge-sm">Limited</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-15" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-15" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>Lenovo ThinkPad X1 Carbon</td>
              <td>$1,799</td>
              <td><span class="badge badge-soft badge-success badge-sm">In Stock</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-16" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-16" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>Google Nest Hub (2nd Gen)</td>
              <td>$99</td>
              <td><span class="badge badge-soft badge-success badge-sm">In Stock</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-17" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-17" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>Fitbit Charge 6</td>
              <td>$149</td>
              <td><span class="badge badge-soft badge-warning badge-sm">Limited</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-18" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-18" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>Razer Blade 16</td>
              <td>$2,499</td>
              <td><span class="badge badge-soft badge-error badge-sm">Out of Stock</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-19" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-19" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>Oculus Quest 3</td>
              <td>$499</td>
              <td><span class="badge badge-soft badge-success badge-sm">In Stock</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-20" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-20" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>Canon EOS R8</td>
              <td>$1,699</td>
              <td><span class="badge badge-soft badge-warning badge-sm">Limited</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-21" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-21" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>DJI Mavic 3 Pro</td>
              <td>$2,199</td>
              <td><span class="badge badge-soft badge-success badge-sm">In Stock</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-22" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-22" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>Alienware Aurora R15</td>
              <td>$2,899</td>
              <td><span class="badge badge-soft badge-error badge-sm">Out of Stock</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td class="w-3.5 pe-0">
                <div class="flex h-5 items-center">
                  <input id="table-checkbox-23" type="checkbox" class="checkbox checkbox-sm" data-datatable-row-selecting-individual="" />
                  <label for="table-checkbox-23" class="sr-only">Checkbox</label>
                </div>
              </td>
              <td>SteelSeries Arctis Nova Pro</td>
              <td>$349</td>
              <td><span class="badge badge-soft badge-warning badge-sm">Limited</span></td>
              <td>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--pencil] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--trash] size-5"></span>
                </button>
                <button class="btn btn-circle btn-text btn-sm" aria-label="Action button">
                  <span class="icon-[tabler--dots-vertical] size-5"></span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="border-base-content/25 flex items-center justify-between gap-3 border-t p-3 max-md:flex-wrap max-md:justify-center">
    <div class="text-base-content/80 text-sm" data-datatable-info="">
      Showing
      <span data-datatable-info-from="1"></span>
      to
      <span data-datatable-info-to="30"></span>
      of
      <span data-datatable-info-length="50"></span>
      products
    </div>
    <div class="flex hidden items-center space-x-1" data-datatable-paging="">
      <button type="button" class="btn btn-text btn-circle btn-sm" data-datatable-paging-prev="">
        <span class="icon-[tabler--chevrons-left] size-4.5 rtl:rotate-180"></span>
        <span class="sr-only">Previous</span>
      </button>
      <div class="[&>.active]:text-bg-soft-primary flex items-center space-x-1" data-datatable-paging-pages=""></div>
      <button type="button" class="btn btn-text btn-circle btn-sm" data-datatable-paging-next="">
        <span class="sr-only">Next</span>
        <span class="icon-[tabler--chevrons-right] size-4.5 rtl:rotate-180"></span>
      </button>
    </div>
  </div>
</div>
```
ep 1: Install jquery
Install jquery using npm.

npm i jquery
2
Step 2: Install Datatable
Install Datatable using npm.

npm install datatables.net
3
Step 3: Include Datatable JavaScript
To integrate Datatable, add the following <script> tags near the end of your </body> section.

<script src="../path/to/vendor/jquery/dist/jquery.min.js"></script>
<script src="../path/to/vendor/datatables.net/js/dataTables.min.js"></script>
4
Step 4: Update Tailwind Configuration
Update your tailwind.css file to include the path for the FlyonUI Datatable custom CSS override.

@import "flyonui/src/vendor/datatables.css";