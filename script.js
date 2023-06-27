// noinspection JSCheckFunctionSignatures,JSUnresolvedVariable

const value_list = {};

const urlParams = new URLSearchParams(window.location.search);

let filter_obj;
let sort_arr;
let settings_obj;

// Try-catch spam is for "legacy" purposes, old JSON-links will still work for a while

filter_obj = parse_custom_url(urlParams.get("filter")) ?? {};

sort_arr = urlParams.get("sort")
        ?.split(',')
        ?.map(prop => {
            let reversed = prop.charAt(0) === '!';
            return {property: prop.substr(reversed), reversed: reversed}
        })
    ?? [];

let header_arr;

settings_obj = parse_custom_url(urlParams.get("settings")) ?? {};

let search = urlParams.get("search") ?? "";
let term, entry_header, exportable_list;

function load_data() {

    initialize_page();
    $.when(
        $.ajax({
            'url': 'data/dictionary.yaml',
            'dataType': "text",
            'success': function (d) {
                d = jsyaml.load(d);
                dictionary = d.sort((a, b) => a.term.toLowerCase() > b.term.toLowerCase() ? 1 : -1);
            }
        }),
        $.ajax({
            'url': 'data/config.json',
            'dataType': "json",
            'success': function (d) {
                config = d;
            }
        })
    ).done(function(){
        header_arr = Object.keys(config.columns);
        display_headers_and_table();
    });
}

function initialize_page() {
    if(Math.random() < 0.01) {
        let body_style = document.getElementsByTagName('body')[0]?.style;
        body_style.background = `linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)), url("assets/tilingllamas.png") repeat`;
        body_style['background-size'] = `1920px 1080px`;
    }
    
    $(window).on('popstate', function () {
        location.reload(true);
    });

    if(typeof settings_obj.search_in_term === 'undefined') {
        settings_obj.search_in_term = "true";
        settings_obj.search_in_aka = "true";
    }

    $('.btn.radio-settings, .btn.toggle-settings').each(function () {
        const setting = $(this).attr("setting");
        const value = $(this).attr("value") ?? "true";
        if (settings_obj[setting] === value) {
            $(this).addClass('active');
        }
    });
    
    $('input[type=checkbox].toggle-settings').each(function () {
        const setting = $(this).attr("setting");
        const value = $(this).attr("value") ?? "true";
        if (settings_obj[setting] === value) {
            this.checked = true;
        }
    });

    $('.radio-settings, .toggle-settings').click(function () {
        const setting = $(this).attr("setting");
        const value = $(this).attr("value") ?? "true";
        const rerender = $(this).attr("rerender");
        if (settings_obj[setting] === value) {
            delete settings_obj[setting];
        } else {
            settings_obj[setting] = value;
        }
        $(this).siblings('a.radio-settings').removeClass('active');
        $(this).toggleClass('active');
        update_window_history();
        if(rerender !== "false") {
            display_headers_and_table();
        }
    });

    $('#search').val(search);
    $('#search').on('input', function () {
        search = $(this).val();
        update_window_history();
        display_results();
    });
}

// This functions only handles headers, but calls display_results()
function display_headers_and_table() {

    $('#output_table').find('thead>tr>th').remove();

    // Add all unique values of a property to a list of possible values for said property (recursively so for objects)
    header_arr.forEach(header_name => {
            values = dictionary.map(entry => entry[header_name] || "No default value has been assigned");
            value_list[header_name] = get_all_values(values, true).map(val => {
                return String(val)
            });
        }
    );

    // Table headers
    $('#output_table').children('thead').children('tr').append(/*html*/`
    <th>
        <div class="dropdown">
            <a class="table-header dropdown-toggle justify-start" data-toggle="dropdown">
                <span>Terms (<span id="entry_count" title="Number of rows">
                </span>)</span>
                <span class="icons">
                    <i class="fas fa-sort-amount-down-alt${
                        sort_arr.some(e => e.property === 'term') && !sort_arr.filter(e => e.property === 'term')[0].reversed 
                            ? '' 
                            : ' display-none'
                        } sorted"></i>
                    <i class="fas fa-sort-amount-up${
                        sort_arr.some(e => e.property === 'term') && sort_arr.filter(e => e.property === 'term')[0].reversed 
                            ? '' 
                            : ' display-none'
                    } sorted-reverse"></i>
                
                    <span class="glyphicon glyphicon-triangle-bottom"></span>
                </span>
            </a>
            <ul class="dropdown-menu">
                <li>
                    <div class="text-center">
                        <span class="btn-group dropdown-actions" role="group">
                            <a role="button" class="btn dropdown-btn btn-default modify-sorting${
                                (sort_arr.some(e => e.property === 'term') 
                                    && !sort_arr.filter(e => e.property === 'term')[0].reversed) 
                                    ? ' active' 
                                    : ''
                                }" property="term" reversed="false"
                            >
                                <i class="fas fa-sort-amount-down-alt"></i>
                            </a>
                            <a role="button" class="btn dropdown-btn btn-default modify-sorting${
                                (sort_arr.some(e => e.property === 'term') 
                                    && sort_arr.filter(e => e.property === 'term')[0].reversed) 
                                    ? ' active' 
                                    : ''
                                }" property="term" reversed="true"
                            >
                                <i class="fas fa-sort-amount-up"></i>
                            </a>
                        </span>
                        <a role="button" class="btn dropdown-btn btn-default export-csv">
                            <i class="fas fa-file-export"></i>Export CSV
                        </a>
                        <a role="button" class="btn dropdown-btn btn-default copy-comma-separated">
                            <i class="fas fa-copy"></i>Copy Comma-Separated List
                        </a>
                    </div>
                </li>
            </ul>
        </div>
    </th>
    `);

    $('.export-csv').click(function (e) {
        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + exportable_list.join('\n'));
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", term + "list.csv");
        document.body.appendChild(link); // Required for FireFox

        link.click();
    });

    $('.copy-comma-separated').click(function (e) {
        let text = exportable_list.join(', ');
        // from: https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
        var input = document.createElement('textarea');
        input.innerHTML = text;
        document.body.appendChild(input);
        input.select();
        var result = document.execCommand('copy');
        document.body.removeChild(input);
        if(result) {
            console.log("List copied successfully");
        }
        return result;
    });

    header_arr.slice(1).forEach(property_id => {

        let sorted = 0;
        if (sort_arr.some(e => e.property === property_id)) {
            if (sort_arr.filter(e => e.property === property_id)[0].reversed) {
                sorted = -1;
            } else {
                sorted = 1;
            }
        }
        let filterable = config.columns[property_id]?.filterable ?? false;
        // Header and dropdown buttons
        let append_data = /*html*/`
            <th>
                <div class="dropdown noselect">
                    <a property="${property_id}" 
                       class="table-header dropdown-toggle justify-start noselect" 
                       data-toggle="dropdown"
                    >
                        ${toTitleCase(property_id)}
                        <span class="icons">
                            <i class="fas fa-filter${typeof filter_obj && filter_obj[property_id] ? '' : ' display-none'} filtered"></i>
                            <i class="fas fa-sort-amount-down-alt${sorted === 1 ? '' : ' display-none'} sorted"></i>
                            <i class="fas fa-sort-amount-up${sorted === -1 ? '' : ' display-none'} sorted-reverse"></i>
                            <span class="glyphicon glyphicon-triangle-bottom"></span>
                        </span>
                    </a>
                    <ul class="dropdown-menu">
                        <li>
                            <div class="text-center">
                                <span class="btn-group dropdown-actions" role="group">
                                    <a role="button" 
                                       class="btn dropdown-btn btn-default modify-sorting${sorted === 1 ? ' active' : ''}" 
                                       property="${property_id}" 
                                       reversed="false"
                                    >
                                        <i class="fas fa-sort-amount-down-alt"></i>
                                    </a>
                                    <a role="button" 
                                       class="btn dropdown-btn btn-default modify-sorting${sorted === -1 ? ' active' : ''}" 
                                       property="${property_id}" 
                                       reversed="true">
                                        <i class="fas fa-sort-amount-up"></i>
                                    </a>`
                                if(filterable) {
                                    append_data +=
                                    `<a role="button" 
                                        class="btn dropdown-btn btn-default toggle-select-all"
                                        property="${property_id}"
                                        >
                                        <i class="far fa-check-square"></i>
                                    </a>`
                                }
                                append_data +=
                                `</span>
                            </div>
                        </li>
                    <li class="divider"></li>
                    <div class="dropdown-scrollable">`;

        // Filter menu
        if (filter_obj[property_id] !== undefined) {
            filter_obj[property_id] = [filter_obj[property_id]].flat();
        }
        
        if(filterable) {
            sort_mixed_types(value_list[property_id]).forEach(option => {
                const color = formatting_color(option, true);
                append_data += /*html*/`<li>
                        <a role="button" class="dropdown-option modify-filter" property="${property_id}" value="${option}">
                            <span class="dot ${color ? color : 'display-none'}"></span>
                            <span class="justify-start">${option}</span>
                            <span class="glyphicon glyphicon-ok${filter_obj[property_id]?.includes(String(option)) ? ' display-none' : ''}">
                            </span></a></li>`
            });
        }
        append_data += `</div></ul></div></th>`;

        $('#output_table').children('thead').children('tr').append(append_data);
    });

    $('.modify-filter').click(function (e) {
        e.stopPropagation();

        const property = $(this).attr("property");
        let value = $(this).attr("value");

        $(this).children().last().toggleClass("display-none")

        // Convert to double if applicable
        // value = (value * 1 == value) ? value * 1 : value;
        if (!Object.keys(filter_obj).includes(property)) {
            filter_obj[property] = [];
        }

        if (filter_obj[property].includes(value)) {
            filter_obj[property].splice(filter_obj[property].indexOf(value), 1);
        } else {
            filter_obj[property].push(value);
            $(this).parents('.dropdown').find('.filtered').removeClass('display-none');
        }

        if (filter_obj[property].length === 0) {
            delete filter_obj[property];
            $(this).parents('.dropdown').find('.filtered').addClass('display-none');
        }
        update_window_history();
        display_results();
    });

    $('.modify-sorting').click(function (e) {
        e.stopPropagation();

        const property = $(this).attr("property");
        const reversed = $(this).attr("reversed") === 'true';

        if (sort_arr.some(e => e.property === property)) {
            if (sort_arr.filter(e => e.property === property)[0].reversed !== reversed) {
                // If already sorted in the opposite order, reverse the sorting
                sort_arr[sort_arr.findIndex(e => e.property === property)].reversed = reversed;

                $(this).parents('.dropdown').find('.sorted').toggleClass('display-none');
                $(this).parents('.dropdown').find('.sorted-reverse').toggleClass('display-none');
            } else {
                // If already sorted in the same order, remove it
                sort_arr.splice(sort_arr.findIndex(e => e.property === property), 1);

                $(this).parents('.dropdown').find('.sorted').addClass('display-none');
                $(this).parents('.dropdown').find('.sorted-reverse').addClass('display-none');
            }
        } else {
            // If not sorted, sort according to selection
            sort_arr.push({"property": property, "reversed": reversed});

            $(this).parents('.dropdown').find(reversed ? '.sorted-reverse' : '.sorted').removeClass('display-none');
        }
        $(this).siblings('a').removeClass('active');
        $(this).toggleClass('active');
        update_window_history();
        display_results();
    });

    $('.toggle-select-all').click(function (e) {
        e.stopPropagation();

        const property = $(this).attr("property");

        if (filter_obj[property] && value_list[property].every(e => filter_obj[property].includes(e))) {
            delete filter_obj[property];
            $(this).parents('ul').find('.glyphicon').removeClass('display-none');
        } else {
            filter_obj[property] = deepCopy(value_list[property]);
            $(this).parents('ul').find('.glyphicon').addClass('display-none');
        }

        update_window_history();
        display_results();
    });
    $('.description-button').click(function (e) {
        e.stopPropagation();
        $(this).parent().toggleClass('open')
    });
    $('.dropdown-submenu>.dropdown-menu').click(function (e) {
        e.stopPropagation();
    });
    display_results();

}

// Displays all the table data
function display_results() {
    $('#output_table').find('tbody>tr').remove();

    // Table data
    output_data = [];

    // Filtering and "pivoting" (from data to output_data)
    dictionary.forEach(entry => {
        let output_entry = {};
        let filtered = false;
        for (let property_id in entry) {
            const selected_element = entry[property_id];

            function filter_element(input_element) {
                if (typeof input_element == 'object') {
                    if (Array.isArray(input_element)) {
                        // shows all values as long as any of them are valid/not blacklisted
                        if(input_element.some(element => filter_element(element) !== undefined)) {
                            return input_element;
                        }
                        return;
                    } else {
                        // won't actually work the same way as ^, but is unused so it's fiiiine
                        const output_obj = {};
                        Object.keys(input_element).forEach(variant => {
                            const value = filter_element(input_element[variant]);
                            if (value !== undefined) {
                                output_obj[variant] = filter_element(input_element[variant]);
                            }
                        });
                        if (Object.keys(output_obj).length === 0) {
                            return;
                        }
                        return output_obj;
                    }
                } else {
                    if ((filter_obj[property_id] || []).includes(String(input_element))) {
                        return;
                    } else {
                        return input_element;
                    }
                }
            }

            output_entry[property_id] = filter_element(selected_element);

            if (output_entry[property_id] === undefined) {
                filtered = true;
            }

        }
        if (!filtered) {
            output_data.push(output_entry);
        }
    });

    // Search filtering:
    output_data = output_data.filter(row => {
        // if no column is selected for search, default to showing all results:
        if (!settings_obj.search_in_term && !settings_obj.search_in_aka && !settings_obj.search_in_description) {
            return true;
        }
        if(search.split('|').some(subsearch =>
            subsearch.split(' ').every(search_term =>
                // show if term appears in selected column:
                   (settings_obj.search_in_term        && row.term        && String(row.term).toLowerCase().includes(search_term.toLowerCase()))
                || (settings_obj.search_in_aka         && row.aka         && String(row.aka).toLowerCase().includes(search_term.toLowerCase()))
                || (settings_obj.search_in_description && row.description && String(row.description).toLowerCase().includes(search_term.toLowerCase()))
            )
        )) return true;
        if(search.charAt(0) === `"`) {
            search_term = search.replace(/"/g, '').toLowerCase();
            return settings_obj.search_in_term && row.term && String(row.term).toLowerCase() == search_term;
        }
        return false;
    })

    // For exporting as CSV:
    exportable_list = output_data.map(entry => entry[term]);

    // // For entry count:
    // $('#entry_count').html(output_data.length.toString());
    $('#entry_count').html(output_data.length.toString());

    function sort_properties(input_data, sort_properties) {
        if (!sort_properties.length) {
            return input_data;
        }

        // Split
        let split_data = [];
        input_data.forEach(data_elm => {
            let split_elements = [deepCopy(data_elm)];

            sort_properties.forEach(property_map => {
                let property = property_map.property;
                let split_element_next = [];

                // Loop trough all currently split elements
                split_elements.forEach(val => {

                    split(val, [], property);

                    function split(row, path, property) {
                        const row_copy = deepCopy(row);

                        let pointer = row_copy;
                        path.forEach(key => {
                            pointer = pointer[key];
                        });

                        if (typeof pointer[property] == 'object') {
                            if (Array.isArray(pointer[property])) {
                                const pointer_copy = deepCopy(pointer);
                                for (let i = 0; i < pointer_copy[property].length; i++) {
                                    pointer[property] = [pointer_copy[property][i]];
                                    split(row_copy, path.concat(property), i);
                                }

                            } else {
                                for (let [key, value] of Object.entries(pointer[property])) {
                                    pointer[property] = {[key]: value};
                                    split(row_copy, path.concat(property), key);
                                }
                            }
                        } else {
                            split_element_next.push(row_copy);
                        }
                    }
                });
                split_elements = split_element_next;
            });
            split_data.push(...split_elements);
        });

        // Sort 
        sort_properties.reverse().forEach(property_entry => {
            let property = property_entry.property;
            let reversed = property_entry.reversed;
            split_data.sort((a, b) => {
                let val_0 = (reversed ? b : a)[property];
                let val_1 = (reversed ? a : b)[property];

                val_0 = get_value(val_0);
                val_1 = get_value(val_1);

                function get_value(value) {
                    if (typeof value == 'object') {
                        return get_value(Object.values(value)[0]);
                    } else {
                        return value;
                    }
                }

                let result = 0;
                if (typeof val_0 == 'string' || typeof val_1 == 'string') {
                    result = val_0.toString().localeCompare(val_1.toString(), undefined, {
                        numeric: true,
                        sensitivity: 'base'
                    });
                } else {
                    result = val_0 > val_1 ? 1 : (val_0 === val_1 ? 0 : -1);
                }

                return result;
            });
        });

        // Recombine
        for (let i = 0; i < split_data.length - 1; i++) {
            let this_elm = split_data[i];
            let next_elm = split_data[i + 1];
            if(this_elm.term === next_elm.term) {
                Object.entries(this_elm).forEach(([property_id, this_value]) => {
                    let next_value = next_elm[property_id];
                    this_elm[property_id] = combine_elements(this_value, next_value);
                });
                split_data.splice(i + 1, 1);
                i--;
            }
        }

        function combine_elements(first, second) {
            if(JSON.stringify(first) == JSON.stringify(second)) {
                return first;
            }
            if(Array.isArray(first)) {
                first.push(...second);
                return first;
            }
            if(Array.isArray(second)) {
                second.unshift(first);
                return second;
            }
            if(typeof first == 'object' && typeof second == 'object') {
                let path = Object.getOwnPropertyNames(second)[0];
                if(first.hasOwnProperty(path)) {
                    first[path] = combine_elements(first[path], second[path])
                } else {
                    first[path] = second[path];
                }
                return first;
            }
            return [first, second];
        }

        return split_data;
    }

    output_data = sort_properties(output_data, sort_arr);

    
    // Table outputting
    if(output_data.length > 0) {
        let append_string = "";
        output_data.forEach(entry => {
            entry.term = value_parser(entry.term);
            entry.aka = value_parser(entry.aka);
            entry.description = value_parser(entry.description);

            append_string += "<tr>";
            if (search) {
                if(settings_obj.search_in_term) entry.term = highlightSearchString(entry.term, search);
                if(settings_obj.search_in_aka) entry.aka = highlightSearchString(entry.aka, search);
                if(settings_obj.search_in_description) entry.description = highlightSearchString(entry.description, search);
            }
            for(let header_name of header_arr) {
                append_string += get_data_cell(entry[header_name] ?? "", header_name);
            }
            // append_string += `<td>:<input type="text">,</td>`;
            append_string += "</tr>";
        });
        $('#output_table').children('tbody').append(append_string);
    } else {
        $('#output_table').children('tbody').append("<tr><td colspan='100%'>No results found</td></tr>");
    }

    function get_data_cell(entry, header_name, top_level = true) {
        let return_data;
        if (typeof (entry) == 'object' && entry != null) {
            return_data = `<td class="nested-cell">`;
            // if (top_level && (get_all_values(entry).length > 2 || (Object.keys(entry).join().match(/<br>/g) || []).length > 2)) {
            //     return_data += `<button class="btn expand-btn ${settings_obj.hide_expand_buttons ? `display-none` : ""}" type="button" data-toggle="collapse-next">Expand</button>\n`
            //     return_data += `<table class="table table-bordered table-hover nested-table expandable ${settings_obj.expand_tables ? "" : `display-none`}"><tbody>`;
            // } else {
            //     return_data += `<table class="table table-bordered table-hover nested-table"><tbody>`;
            // }
            return_data += `<table class="table table-bordered table-hover nested-table"><tbody>`;

            if (Array.isArray(entry)) {
                entry.forEach(value => {
                    return_data += `<tr>${get_data_cell(value, header_name, false)}</tr>`;
                });
            } else {
                Object.keys(entry).forEach(key => {
                    return_data += `<tr><td>${key}</td>${get_data_cell(entry[key], header_name, false)}</tr>`;
                });
            }
            return_data += "</tbody></table></td>";

        } else {
            return_data = `<td ${formatting_color(entry)}>${entry}</td>`;
        }
        return return_data;
    }

    // Toggle functionality of 'Expand' buttons 
    $('body').off('click.collapse-next.data-api');
    $('body').on('click.collapse-next.data-api', '[data-toggle=collapse-next]', function (_e) {
        const $target = $(this).next();
        // Not sure which one I prefer:
        // $target.toggle("toggle"); // With toggle animation/delay
        // $target.toggle(); // No toggle animation/delay
        $target.toggleClass("display-none"); // uses a class instead
    });

    $('.entry-mention').click(function (e) {
        e.stopPropagation();

        const entry = `"${$(this).attr("entry")}"`;
        $('#search').val(entry);
        search = entry;
        
        update_window_history();
        display_results();
    });

}

function get_all_values(input, unique_only = false) {
    if (typeof input == 'object') {
        let return_arr = [];
        for (let value in input) {
            return_arr = return_arr.concat(...get_all_values(input[value]));
        }
        if (unique_only) {
            return_arr = [...new Set(return_arr)]
        }
        return return_arr;
    } else {
        return [input];
    }
}

function sort_mixed_types(list) {
    return list.sort((a, b) => {
        if (typeof a == 'number' && typeof b == 'number') {
            return a - b;
        } else if (typeof a == 'string' && typeof b == 'number') {
            return -1;
        } else if (typeof a == 'number' && typeof b == 'string') {
            return 1;
        } else {
            return a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'});
        }
    });
}

function formatting_color(value, class_exists = false) {
    let color = "";

    let found_key;
    if (found_key = Object.keys(config.conditional_formatting ?? {}).find(key_regex => new RegExp(`^${key_regex}$`).test(value))) {
        color = config.conditional_formatting[found_key];
        if (!class_exists) {
            color = `class="${color}"`;
        }
        return color;
    }
}

function scale(number, inMax, outMin, outMax) {
    // Minimum in value is assumed to be 0
    return Math.round(((number) * (outMax - outMin) / (inMax) + outMin) * 100) / 100;
}

function update_window_history() {
    let url = "";

    // if(Object.keys(settings_obj).length > 0)    url += "&settings=" + JSON.stringify(settings_obj);
    // if(Object.keys(filter_obj).length > 0)      url += "&filter=" + JSON.stringify(filter_obj);
    // if(sort_arr.length > 0)                     url += "&sort=" + JSON.stringify(sort_arr);

    if (Object.keys(settings_obj).length > 0) {
        url += "&settings=" + serialize_custom_url(settings_obj);
    }
    if (Object.keys(filter_obj).length > 0) {
        url += "&filter=" + serialize_custom_url(filter_obj);
    }
    if (sort_arr.length > 0) {
        url += "&sort=" + sort_arr.map(obj => obj.reversed ? '!' + obj.property : obj.property);
    }
    ;
    if (search.length > 0) {
        url += "&search=" + search;
    }

    if (url !== "") {
        url = '?' + url.substr(1) + '#';
    }
    url = window.location.origin + window.location.pathname + url;

    window.history.pushState("", "", url);
}

// Constructs the custom url parameters:
// "abc" -> abc
// ["a", "b", 123] -> a,b,123
// {key:val} -> (key:val)
// {key:val,foo:bar} -> (key:val);(foo:bar)
function serialize_custom_url(value) {
    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            return value.map(v => serialize_custom_url(v)).join(',')
        }
        return Object.entries(value).map(([key, v]) =>
            "(" + key + ":" + serialize_custom_url(v) + ")"
        ).join(';');
    } else {
        return value;
    }
}

// Only supports objects at the top level, nested objects will break parsing.
function parse_custom_url(value) {
    if (value === '') {
        return false;
    }
    if (value === undefined || value === null) {
        return null;
    }
    if (value.charAt(0) === '(') {
        const split = value.split(';');
        const result = {};
        split.forEach(obj_str => {
            obj_str = obj_str.substr(1, obj_str.length - 2);
            const [key, ...val] = obj_str.split(':');
            result[key] = parse_custom_url(val.join());
        })
        return result;
    }
    const split = value.split(',');
    if (split.length > 1) {
        return split.map(v => parse_custom_url(v))
    }
    // if (value * 1 == value) {
    //     return parseFloat(value);
    // }
    return value
}

function deepCopy(obj) {
    if (Array.isArray(obj)) {
        let result = [];

        for (let index in obj) {
            result.push(deepCopy(obj[index]));
        }

        return result;
    } else if (typeof obj == 'object') {
        let result = {};

        for (let [key, value] of Object.entries(obj)) {
            result[key] = deepCopy(value);
        }

        return result;
    }

    return obj;
}

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function () {
    scrollFunction()
};

function scrollFunction() {
    let scrollButton = document.getElementById("scrollButton");
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        scrollButton.style.display = "block";
    } else {
        scrollButton.style.display = "none";
    }
}

// When the user clicks on the button, scroll to the top of the document
function scrollToTop() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

function isNum(val){
    if(val === "") return false;
    return !isNaN(val)
}

function highlightSearchString(input, search) {
    if(Array.isArray(input)) {
        return input.map(v => highlightSearchString(v, search));
    }
    if(typeof input === 'undefined') return undefined;
    search.replaceAll('"', '')
        .split(' ')
        .filter(e => e !== '')
        .forEach(search_term => {
            search_term = search_term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
            var search_regex = new RegExp(`${search_term}(?![^<]*>)`, "gi");
            input = input.replaceAll(search_regex, '{{{$&}}}');
        });
    input = input.replace(/{{{/g, '<span class="search-highlight">').replace(/}}}/g, '</span>');
    return input;
}

function value_parser(value) {
    if(Array.isArray(value)) {
        return value.map(v => value_parser(v));
    }
    if(isNum(value)) return value;
    if(typeof value === 'string') {
        // Entry @-mention
        // Matches either @[term] or @[alternative text](term), and links the term, but
        // uses either the term or alt text depending on which half of the regex OR expression
        // is used, by outputting both, as their occurance is mutually exclusive.
        const entry_mention_regexp = /@\[([^\]]*?)\]\((.*?)\)|@\[([^\]]*?)\]/g;
        value = value.replace(entry_mention_regexp, `<a role="button" class="entry-mention" entry="$2$3">$1$3</a>`);

        // Markdown-style URL parsing:
        // Matches [text](link)
        const markdown_url_regexp = /\[([^\]]*?)\]\((.*?)\)/g;
        value = value.replace(markdown_url_regexp, `<a target="_blank" href="$2">$1</a>`);
        
        // Basic URL parsing:
        // Only cares about http/https, matches "normal" url format until the first space.
        const basic_url_regexp = /(https?:\/\/(\w*\.)+\w+\/?[^ ]*)/g;
        value = value.replace(basic_url_regexp, `<a target="_blank" href="$1">$1</a>`);
        
        return value;
    }
    return value;
}
