/// <reference path="base/container/MultiMap.ts" />

namespace std
{
	/**
	 * <p> Hashed, unordered Multimap. </p>
	 * 
	 * <p> {@link HashMap}s are associative containers that store elements formed by the combination of 
	 * a <i>key value</i> and a <i>mapped value</i>, much like {@link HashMap} containers, but allowing 
	 * different elements to have equivalent <i>keys</i>. </p>
	 *
	 * <p> In an {@link HashMap}, the <i>key value</i> is generally used to uniquely identify the 
	 * element, while the <i>mapped value</i> is an object with the content associated to this <i>key</i>. 
	 * Types of <i>key</i> and <i>mapped value</i> may differ. </p>
	 *
	 * <p> Internally, the elements in the {@link HashMap} are not sorted in any particular order with 
	 * respect to either their <i>key</i> or <i>mapped values</i>, but organized into <i>buckets</i> depending on 
	 * their hash values to allow for fast access to individual elements directly by their <i>key values</i> 
	 * (with a constant average time complexity on average). </p>
	 *
	 * <p> Elements with equivalent <i>keys</i> are grouped together in the same bucket and in such a way that 
	 * an iterator can iterate through all of them. Iterators in the container are doubly linked iterators. </p>
	 *
	 * <h3> Container properties </h3>
	 * <dl>
	 *	<dt> Associative </dt>
	 *	<dd> Elements in associative containers are referenced by their <i>key</i> and not by their absolute 
	 *		 position in the container. </dd>
	 * 
	 *	<dt> Hashed </dt>
	 *	<dd> Hashed containers organize their elements using hash tables that allow for fast access to elements 
	 *		 by their <i>key</i>. </dd>
	 * 
	 *	<dt> Map </dt>
	 *	<dd> Each element associates a <i>key</i> to a <i>mapped value</i>: 
	 *		 <i>Keys</i> are meant to identify the elements whose main content is the <i>mapped value</i>. </dd>
	 * 
	 *	<dt> Multiple equivalent keys </dt>
	 *	<dd> The container can hold multiple elements with equivalent <i>keys</i>. </dd>
	 * </dl>
	 * 
	 * <ul>
	 *  <li> Reference: http://www.cplusplus.com/reference/unordered_map/unordered_multimap/ </li>
	 * </ul>
	 *
	 * @param <Key> Type of the key values. 
	 *				Each element in an {@link HashMap} is identified by a key value.
	 * @param <T> Type of the mapped value. 
	 *			  Each element in an {@link HashMap} is used to store some data as its mapped value.
	 *
	 * @author Jeongho Nam <http://samchon.org>
	 */
	export class HashMultiMap<Key, T>
		extends base.container.MultiMap<Key, T>
	{
		private hash_buckets_: base.hash.MapHashBuckets<Key, T>;
	
		/* =========================================================
			CONSTRUCTORS & SEMI-CONSTRUCTORS
				- CONSTRUCTORS
				- ASSIGN & CLEAR
		============================================================
			CONSTURCTORS
		--------------------------------------------------------- */
		/**
		 * Default Constructor.
		 */
		public constructor();

		/**
		 * Contruct from elements.
		 *
		 * @param array Elements to be contained.
		 */
		public constructor(array: Array<Pair<Key, T>>);

		/**
		 * Contruct from tuples.
		 *
		 * @param array Tuples to be contained.
		 */
		public constructor(array: Array<[Key, T]>);

		/**
		 * Copy Constructor.
		 *
		 * @param container Another map to copy.
		 */
		public constructor(container: base.container.MapContainer<Key, T>);

		/**
		 * Range Constructor.
		 *
		 * @param begin nput interator of the initial position in a sequence.
		 * @param end Input interator of the final position in a sequence.
		 */
		public constructor(begin: MapIterator<Key, T>, end: MapIterator<Key, T>);

		public constructor(...args: any[])
		{
			super();
			
			// HASH_BUCKET
			this.hash_buckets_ = new base.hash.MapHashBuckets<Key, T>(this);

			// OVERLOADINGS
			if (args.length == 1 && args[0] instanceof Array)
			{
				this.construct_from_array(args[0]);
			}
			else if (args.length == 1 && args[0] instanceof base.container.MapContainer)
			{
				this.construct_from_container(args[0]);
			}
			else if (args.length == 2 && args[0] instanceof MapIterator && args[1] instanceof MapIterator)
			{
				this.construct_from_range(args[0], args[1]);
			}
		}

		/**
		 * @hidden
		 */
		protected construct_from_array(items: Array<Pair<Key, T>>): void
		{
			this.hash_buckets_.reserve(items.length * base.hash.RATIO);

			super.construct_from_array(items);
		}
		
		/* ---------------------------------------------------------
			ASSIGN & CLEAR
		--------------------------------------------------------- */
		/**
		 * @inheritdoc
		 */
		public assign<L extends Key, U extends T, InputIterator extends MapIterator<L, U>>
			(begin: InputIterator, end: InputIterator): void
		{
			let it: InputIterator;
			let size: number = 0;
			
			// REVERSE HASH_GROUP SIZE
			for (it = begin; it.equals(end) == false; it = it.next() as InputIterator)
				size++;

			this.hash_buckets_.clear();
			this.hash_buckets_.reserve(size * base.hash.RATIO);

			// SUPER; INSERT
			super.assign(begin, end);
		}
		
		/**
		 * @inheritdoc
		 */
		public clear(): void
		{
			super.clear();

			this.hash_buckets_.clear();
		}

		/* =========================================================
			ACCESSORS
		========================================================= */
		/**
		 * @inheritdoc
		 */
		public find(key: Key): MapIterator<Key, T>
		{
			return this.hash_buckets_.find(key);
		}

		/* =========================================================
			ELEMENTS I/O
				- INSERT
				- POST-PROCESS
		============================================================
			INSERT
		--------------------------------------------------------- */
		/**
		 * @hidden
		 */
		protected insert_by_pair(pair: Pair<Key, T>): any
		{
			let listIterator = this.data_.insert(this.data_.end(), pair);

			let it = new MapIterator<Key, T>(this, listIterator);
			this.handle_insert(it);

			return it;
		}

		/**
		 * @hidden
		 */
		protected insert_by_range<L extends Key, U extends T, InputIterator extends MapIterator<L, U>>
			(begin: InputIterator, end: InputIterator): void
		{
			// CALCULATE INSERTING SIZE
			let size: number = 0;
			for (let it = begin; it.equals(end) == false; it = it.next() as InputIterator)
				size++;

			// IF NEEDED, HASH_BUCKET TO HAVE SUITABLE SIZE
			if (this.size() + size > this.hash_buckets_.item_size() * base.hash.MAX_RATIO)
				this.hash_buckets_.reserve((this.size() + size) * base.hash.RATIO);

			// INSERTS
			super.insert_by_range(begin, end);
		}

		/* ---------------------------------------------------------
			POST-PROCESS
		--------------------------------------------------------- */
		/**
		 * @inheritdoc
		 */
		protected handle_insert(it: MapIterator<Key, T>): void
		{
			this.hash_buckets_.insert(it);
		}

		/**
		 * @inheritdoc
		 */
		protected handle_erase(it: MapIterator<Key, T>): void
		{
			this.hash_buckets_.erase(it);
		}

		/* ===============================================================
			UTILITIES
		=============================================================== */
		/**
		 * @inheritdoc
		 */
		public swap(obj: base.container.MapContainer<Key, T>): void
		{
			if (obj instanceof HashMultiMap)
				this.swap_hash_multimap(obj);
			else
				super.swap(obj);
		}

		/**
		 * @hidden
		 */
		private swap_hash_multimap(obj: HashMultiMap<Key, T>): void
		{
			let supplement: HashMultiMap<Key, T> = new HashMultiMap<Key, T>();
			supplement.data_ = this.data_;
			supplement.hash_buckets_ = this.hash_buckets_;

			this.data_ = obj.data_;
			this.hash_buckets_ = obj.hash_buckets_;

			obj.data_ = supplement.data_;
			obj.hash_buckets_ = supplement.hash_buckets_;
		}
	}
}