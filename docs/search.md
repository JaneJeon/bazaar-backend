# Search Documentation

We're using algolia for our search feature.

Almost every "resource" created/updated/deleted will be reflected in algolia, so the user just needs to search algolia with the right index. For example, to search `art`, you would search the `arts` index! And this goes for literally _all_ resources!

Some resources are not indexed. To see which ones _are_ indexed, please see the `searchEnabled` property of resource models.

Each resource is indexed with the `objectID` (basically algolia's version of primary key) equivalent to the resource's id. If the resource has an _array_ of id's (for example, a negotiation's primary key contains commission_id and artist_id), then the `objectID` for that resource will be a concatenation of said ID's with a `-` in-between.

For now, resources that go "private" (e.g. commissions after an artist is chosen) AREN'T taken off of algolia, although that is a feature in works.
