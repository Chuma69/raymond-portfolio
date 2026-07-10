import {defineType, defineField} from 'sanity'

// An article powers the home "Writing" section — the title, its raymond.wtf
// link, and the date shown beside it.
export default defineType({
  name: 'article',
  title: 'Writing',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'url',
      title: 'Link (raymond.wtf)',
      type: 'url',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      options: {dateFormat: 'YYYY-MM-DD'},
      validation: (r) => r.required(),
    }),
  ],
  orderings: [{title: 'Newest first', name: 'dateDesc', by: [{field: 'date', direction: 'desc'}]}],
  preview: {select: {title: 'title', subtitle: 'date'}},
})
