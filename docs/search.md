# Search Documentation
We're using algolia for our search feature.
TODO: keys

Almost every "resource" created/updated/deleted will be reflected in algolia, so the user just needs to search algolia with the right index. For example, to search `art`, you would search the `arts` index! And this goes for literally *all* resources!

Some resources are not indexed. To see which ones *are* indexed, please see the `searchEnabled` property of resource models.
