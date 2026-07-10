import {defineType, defineField} from 'sanity'

// A book powers the home "Currently reading" section.
export default defineType({
  name: 'book',
  title: 'Currently reading',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({name: 'author', title: 'Author', type: 'string'}),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'e.g. Architecture, Systems, Operations',
    }),
    defineField({name: 'order', title: 'Order', type: 'number', description: 'Lower numbers appear first'}),
  ],
  orderings: [{title: 'Order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'author'}},
})
