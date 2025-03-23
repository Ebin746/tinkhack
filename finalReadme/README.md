# project

## File List

- components\Categories.js
- components\Comments.js
- components\CommentsForm.js
- components\Footer.js
- components\Loader.js
- components\Navbar.js
- components\PostDetail.js
- data\post-data.js
- package.json
- pages\api\comments.js
- pages\category\[slug].js
- pages\index.js
- pages\post\[slug].js
- pages\search\result.js
- pages\_app.js
- postcss.config.js
- README.md
- sections\ChosenBlog.js
- sections\Landing.js
- sections\SubmitedBlog.js
- services\index.js
- styles\globals.css
- tailwind.config.js

## File Contents

### components\Categories.js
```
"use client"
import { useState, useEffect } from 'react';


import Link from 'next/link'

import { getCategories } from '../services';

function Categories() {
    const [categories, setCategories] = useState([])

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const catData = await getCategories()
                setCategories(catData)
            } catch (error) {
                console.log("Error fetching catedories", error);
            }
        }
        fetchCategories()
    }, [])


    return (
        <div className='max-w-screen-xl  mx-auto p-4 mt-5 mb-5 md:overflow-hidden overflow-y-auto hidden md:block'>
            <div className='flex flex-nowrap gap-10 md:gap-28  md:justify-center '>
                <span className='cat_main'>All Categories</span>
                {categories.map((item, index) => (
                    <div className='cat_title'>
                        <Link key={index} href={`/category/${item.slug}`}>
                            {item.name}
                        </Link>
                    </div>
                ))}

            </div>
        </div>
    )
}

export default Categories
```

### components\Comments.js
```
import React, { useEffect, useState } from 'react';

import moment from 'moment';
import parse from 'html-react-parser';

import { getComments } from '../services';



const Comments = ({ slug }) => {
    const [comments, setComments] = useState([]);

    useEffect(() => {
        getComments(slug).then((result) => {
            setComments(result);
        });
    }, []);

    return (
        <>
            {comments.length > 0 && (
                <div className="bg-white shadow-lg rounded-lg p-8 pb-12 mb-8">
                    <h3 className="text-xl mb-8 font-semibold border-b pb-4">
                        {comments.length}
                        {' '}
                        Comments
                    </h3>
                    {comments.map((comment, index) => (
                        <div key={index} className="border-b border-gray-100 mb-4 pb-4">
                            <p className="mb-4">
                                <span className="font-semibold">{comment.name}</span>
                                {' '}
                                on
                                {' '}
                                {moment(comment.createdAt).format('MMM DD, YYYY')}
                            </p>
                            <p className="whitespace-pre-line text-gray-600 w-full">{parse(comment.comment)}</p>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

export default Comments;
```

### components\CommentsForm.js
```
import React, { useState, useEffect } from 'react';
import { submitComment } from '../services';

const CommentsForm = ({ slug }) => {
    const [error, setError] = useState(false);
    const [localStorage, setLocalStorage] = useState(null);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [formData, setFormData] = useState({ name: null, email: null, comment: null, storeData: false });

    useEffect(() => {
        setLocalStorage(window.localStorage);
        const initalFormData = {
            name: window.localStorage.getItem('name'),
            email: window.localStorage.getItem('email'),
            storeData: window.localStorage.getItem('name') || window.localStorage.getItem('email'),
        };
        setFormData(initalFormData);
    }, []);

    const onInputChange = (e) => {
        const { target } = e;
        if (target.type === 'checkbox') {
            setFormData((prevState) => ({
                ...prevState,
                [target.name]: target.checked,
            }));
        } else {
            setFormData((prevState) => ({
                ...prevState,
                [target.name]: target.value,
            }));
        }
    };

    const handlePostSubmission = () => {
        setError(false);
        const { name, email, comment, storeData } = formData;
        if (!name || !email || !comment) {
            setError(true);
            return;
        }
        const commentObj = {
            name,
            email,
            comment,
            slug,
        };

        if (storeData) {
            localStorage.setItem('name', name);
            localStorage.setItem('email', email);
        } else {
            localStorage.removeItem('name');
            localStorage.removeItem('email');
        }

        submitComment(commentObj)
            .then((res) => {
                if (res.createComment) {
                    if (!storeData) {
                        formData.name = '';
                        formData.email = '';
                    }
                    formData.comment = '';
                    setFormData((prevState) => ({
                        ...prevState,
                        ...formData,
                    }));
                    setShowSuccessMessage(true);
                    setTimeout(() => {
                        setShowSuccessMessage(false);
                    }, 3000);
                }
            });
    };

    return (
        <div className="bg-white shadow-lg rounded-lg p-8 pb-12 mb-8">
            <h3 className="text-xl mb-8 font-semibold border-b pb-4">Leave a Reply</h3>
            <div className="grid grid-cols-1 gap-4 mb-4">
                <textarea value={formData.comment} onChange={onInputChange} className="p-4 outline-none w-full rounded-lg h-40 focus:ring-2 focus:ring-gray-200 bg-gray-100 text-gray-700" name="comment" placeholder="Comment" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <input type="text" value={formData.name} onChange={onInputChange} className="py-2 px-4 outline-none w-full rounded-lg focus:ring-2 focus:ring-gray-200 bg-gray-100 text-gray-700" placeholder="Name" name="name" />
                <input type="email" value={formData.email} onChange={onInputChange} className="py-2 px-4 outline-none w-full rounded-lg focus:ring-2 focus:ring-gray-200 bg-gray-100 text-gray-700" placeholder="Email" name="email" />
            </div>
            <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                    <input checked={formData.storeData} onChange={onInputChange} type="checkbox" id="storeData" name="storeData" value="true" />
                    <label className="text-gray-500 cursor-pointer" htmlFor="storeData"> Save my name, email in this browser for the next time I comment.</label>
                </div>
            </div>
            {error && <p className="text-xs text-red-500">All fields are mandatory</p>}
            <div className="mt-8">
                <button type="button" onClick={handlePostSubmission} className="transition duration-500 ease hover:bg-indigo-900 inline-block bg-pink-600 text-lg font-medium rounded-full text-white px-8 py-3 cursor-pointer">Post Comment</button>
                {showSuccessMessage && <span className="text-xl float-right font-semibold mt-3 text-green-500">Comment submitted for review</span>}
            </div>
        </div>
    );
};

export default CommentsForm;
```

### components\Footer.js
```

import Link from 'next/link'
import dynamic from 'next/dynamic'

function Footer() {
    return (

        <footer class="bg-white rounded-lg shadow m-4 dark:bg-gray-800">
            <div class="w-full mx-auto max-w-screen-xl p-4 md:flex md:items-center md:justify-between text-center">
                <span class="text-sm text-gray-500 sm:text-center dark:text-gray-400 copyright">© 2023 <a href="/" class="hover:underline copyright">Mehranlip Blog™</a>. All Rights Reserved.
                </span>
                <ul class="flex flex-wrap items-center mt-3 text-sm text-center font-medium text-gray-500 dark:text-gray-400 sm:mt-0">
                    <li>
                        <Link href="/" class="mr-4 hover:underline md:mr-6  footer-link">Home page</Link>
                    </li>
                    <li>
                        <Link href="/category/news" class="mr-4 hover:underline md:mr-6 footer-link">News</Link>
                    </li>
                    <li>
                        <Link href="https://mehranlip.ir" class="mr-4 hover:underline md:mr-6 footer-link">About us</Link>
                    </li>
                    <li>
                        <Link href="#" class="hover:underline footer-link">Contact</Link>
                    </li>
                </ul>
            </div>
        </footer>

    )
}

export default dynamic(() => Promise.resolve(Footer), { ssr: false })
```

### components\Loader.js
```
const Loader = () => (
    <div className="text-center">
        <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base leading-6 font-medium rounded-md text-white bg-rose-600 hover:bg-rose-500 focus:border-rose-700 active:bg-rose-700 transition ease-in-out duration-150 cursor-not-allowed"
            disabled=""
        >
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading
        </button>
    </div>
);

export default Loader;
```

### components\Navbar.js
```
import React from 'react'

import Link from 'next/link'


function Navbar() {
    return (
        <>
            <header>
                <title>Mehranlip Blog</title>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.0.0/flowbite.min.js"></script>
                <link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.0.0/flowbite.min.css" rel="stylesheet" />
            </header>
            <nav className=" w-full z-20 top-0 left-0 ">
                <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                    <Link href="/" className="flex items-center Main_logo">
                        Mehranlip Blog
                    </Link>
                    <div className="flex md:order-2">
                        <button className='mr-4'>
                            <Link href="/search/result">
                                <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                                </svg>
                            </Link>
                        </button>
                        <button type="button" className="button_navbar hidden md:block focus:ring-4 px-4 py-2 text-center mr-3 md:mr-0"><Link href="https://app.hygraph.com">
                            Get Articler
                        </Link> </button>

                        <button data-collapse-toggle="navbar-sticky" type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-sticky" aria-expanded="false">
                            <span className="sr-only">Open main menu</span>
                            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h15M1 7h15M1 13h15" />
                            </svg>
                        </button>
                    </div>
                    <div className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1" id="navbar-sticky">
                        <ul className="flex flex-col p-4 md:p-0 mt-4 md:flex-row md:space-x-8 md:mt-0 md:border-0">
                            <li>
                                <Link href="/" className="Navbar_link block py-2 pl-3 pr-4 hover:opacity-70 " >Home page</Link>
                            </li>
                            <li>
                                <Link href="/category/news" className=" Navbar_link block py-2 pl-3 pr-4 hover:opacity-70">News</Link>
                            </li>
                            <li>
                                <Link href="https://mehranlip.ir/" className=" Navbar_link block py-2 pl-3 pr-4 hover:opacity-70">About us</Link>
                            </li>
                            <li>
                                <Link href="#" className=" Navbar_link block py-2 pl-3 pr-4 hover:opacity-70">Contact</Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </>


    )
}

export default Navbar
```

### components\PostDetail.js
```
import React from 'react';
import moment from 'moment';

import { CopyBlock, github } from 'react-code-blocks';
import { FaCopy } from 'react-icons/fa';
import copy from 'copy-to-clipboard';

const PostDetail = ({ post }) => {
    const getContentFragment = (index, text, obj, type) => {
        let modifiedText = text;

        if (obj) {
            if (obj.bold) {
                modifiedText = (<b key={index}>{text}</b>);
            }

            if (obj.italic) {
                modifiedText = (<em key={index}>{text}</em>);
            }

            if (obj.underline) {
                modifiedText = (<u key={index}>{text}</u>);
            }
        }

        switch (type) {
            case 'heading-three':
                return <h3 key={index} className="text-xl font-semibold mb-4">{modifiedText.map((item, i) => <React.Fragment key={i}>{item}</React.Fragment>)}</h3>;
            case 'paragraph':
                return <p key={index} className="mb-8">{modifiedText.map((item, i) => <React.Fragment key={i}>{item}</React.Fragment>)}</p>;
            case 'heading-four':
                return <h4 key={index} className="text-md font-semibold mb-4">{modifiedText.map((item, i) => <React.Fragment key={i}>{item}</React.Fragment>)}</h4>;
            case 'image':
                return (
                    <div class="flex justify-center items-center mt-5 mb-5">
                        <img
                            key={index}
                            alt={obj.title}
                            height={obj.height}
                            width={obj.width}
                            src={obj.src}
                        />
                    </div>
                );
            case 'code-block':
                return (
                    <div className="overflow-x-auto mb-5 mt-5 rounded-lg">
                        <CopyBlock key={index} text={modifiedText} language="jsx" showLineNumbers={true} theme={github} CodeBlock icon={<FaCopy />} onCopy={() => copy(modifiedText)} />
                    </div>
                )
            default:
                return modifiedText;
        }
    };

    return (
        <>
            <div className=" rounded-lg p-5 pb-12 mb-8">
                <div class=" order-last md:order-first relative ">
                    <div className='grid items-end cover-gradient p-5 '>
                        <div>
                            <div>
                                <h1 className="mb-4  title-post-detail">{post.title}</h1>
                            </div>
                            <div className='mt-3 flex flex-row md:gap-10 gap-4'>
                                <div className="flex items-center mb-0 md:mb-3 w-full">
                                    <div className=" md:flex  justify-center lg:mb-0 lg:w-auto mr-8 ">
                                        <img
                                            alt={post.author.name}
                                            height="30px"
                                            width="30px"
                                            className="align-middle rounded-full inline"
                                            src={post.author.photo.url}
                                        />
                                        <span className="inline align-middle ml-2  text-lg name-account-post-detail">{post.author.name}</span>
                                    </div>
                                    <div className="font-medium">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="align-middle text-lg name-account-post-detail">{moment(post.createdAt).format('MMM DD, YYYY')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <img src={post.featuredImgae.url} alt="" className="object-cover  cover-chosen cover-post-details   w-full   shadow-lg" />
                </div>
                <div className="relative  mb-6 p-3">
                </div>
                <div className="px-4 lg:px-0 paragraph-post-details max-w-screen-xl items-center mx-auto ">
                    {post.content.raw.children.map((typeObj, index) => {
                        const children = typeObj.children.map((item, itemindex) => getContentFragment(itemindex, item.text, item));

                        return getContentFragment(index, children, typeObj, typeObj.type);
                    })}
                </div>
            </div>

        </>
    );
};

export default PostDetail;
```

### data\post-data.js
```
export const posts = {
    post: [
        {
            title: "Pink stairs leading to the sky",
            summay: " refers to errors in thinking that can lead to incorrect perception and decision-making. They are an inherent part of our psychology and can affect [...]",
            author: "Mehran Asadi",
            date: "Apr 8, 2023",
            image: "/post-image.png"
        },
        {
            title: "Pink stairs leading to the sky",
            summay: " refers to errors in thinking that can lead to incorrect perception and decision-making. They are an inherent part of our psychology and can affect [...]",
            author: "Mehran Asadi",
            date: "Apr 8, 2023",
            image: "/post-image.png"
        },
        {
            title: "Pink stairs leading to the sky",
            summay: " refers to errors in thinking that can lead to incorrect perception and decision-making. They are an inherent part of our psychology and can affect [...]",
            author: "Mehran Asadi",
            date: "Apr 8, 2023",
            image: "/post-image.png"
        },
        {
            title: "Pink stairs leading to the sky",
            summay: " refers to errors in thinking that can lead to incorrect perception and decision-making. They are an inherent part of our psychology and can affect [...]",
            author: "Mehran Asadi",
            date: "Apr 8, 2023",
            image: "/post-image.png"
        },
        {
            title: "Pink stairs leading to the sky",
            summay: " refers to errors in thinking that can lead to incorrect perception and decision-making. They are an inherent part of our psychology and can affect [...]",
            author: "Mehran Asadi",
            date: "Apr 8, 2023",
            image: "/post-image.png"
        },
        {
            title: "Pink stairs leading to the sky",
            summay: " refers to errors in thinking that can lead to incorrect perception and decision-making. They are an inherent part of our psychology and can affect [...]",
            author: "Mehran Asadi",
            date: "Apr 8, 2023",
            image: "/post-image.png"
        },
        {
            title: "Pink stairs leading to the sky",
            summay: " refers to errors in thinking that can lead to incorrect perception and decision-making. They are an inherent part of our psychology and can affect [...]",
            author: "Mehran Asadi",
            date: "Apr 8, 2023",
            image: "/post-image.png"
        },
    ]
}
```

### package.json
```
{
  "name": "cms_blog",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "flowbite": "^2.0.0",
    "flowbite-react": "^0.6.4",
    "graphql": "^16.8.1",
    "graphql-request": "^6.1.0",
    "html-react-parser": "^5.0.1",
    "moment": "^2.29.4",
    "next": "14.0.0",
    "owl.carousel": "^2.3.4",
    "react": "18.2.0",
    "react-code-blocks": "^0.1.4",
    "react-copy-to-clipboard": "^5.1.0",
    "react-dom": "18.2.0",
    "sass": "^1.69.5",
    "swr": "^2.2.4"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.16",
    "eslint": "8.52.0",
    "eslint-config-next": "14.0.0",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5"
  }
}

```

### pages\api\comments.js
```
import { GraphQLClient, gql } from 'graphql-request';

const graphqlAPI = process.env.NEXT_PUBLIC_GRAPHCMS_ENDPOINT;

/** *************************************************************
* Any file inside the folder pages/api is mapped to /api/* and  *
* will be treated as an API endpoint instead of a page.         *
*************************************************************** */

// export a default function for API route to work
export default async function asynchandler(req, res) {
    const graphQLClient = new GraphQLClient((graphqlAPI), {
        headers: {
            authorization: `Bearer ${process.env.GRAPHCMS_TOKEN}`,
        },
    });

    const query = gql`
    mutation CreateComment($name: String!, $email: String!, $comment: String!, $slug: String!) {
      createComment(data: {name: $name, email: $email, comment: $comment, post: {connect: {slug: $slug}}}) { id }
    }
  `;

    const result = await graphQLClient.request(query, {
        name: req.body.name,
        email: req.body.email,
        comment: req.body.comment,
        slug: req.body.slug,
    });

    return res.status(200).send(result);
}
```

### pages\category\[slug].js
```
"use client"

import { useRouter } from 'next/router';
import { getCategories, getCategoryPost } from '../../services';
import Loader from '../../components/Loader';
import Categories from '../../components/Categories';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';



const CategoryPost = ({ posts }) => {
    const router = useRouter();

    if (router.isFallback) {
        return <Loader />;
    }


    return (
        <>
            <Navbar />
            <div className='max-w-screen-xl  mx-auto p-2'>
                <Categories />
                <div className='flex flex-row justify-between p-3'>
                    <div className='grid grid-cols-1  md:grid-cols-4 gap-6 mt-5 p-5'>
                        {
                            posts.map((item) => (
                                <Link href={`/post/${item.node.slug}`}>
                                    <div key={item.cursor} class="max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                                        <a href="#">
                                            <img class="rounded-t-lg w-full h-full  object-cover image-cover-post " src={item.node.featuredImgae.url} width={300} height={200} alt="image post" />
                                        </a>
                                        <div class="p-5">
                                            <a href="#">
                                                <h5 class="mb-2 title-post-sub">{item.node.title}</h5>
                                            </a>
                                            <p class="mb-3 paragraph-post-sub">{item.node.excerpt}</p>
                                            <a href="#" class="inline-flex items-center px-3 py-2 text-sm  text-center button-post-sub">
                                                Read more
                                                <svg class="w-3.5 h-3.5 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        }

                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}

export default CategoryPost


// Fetch data at build time
export async function getStaticProps({ params }) {
    const posts = await getCategoryPost(params.slug);

    return {
        props: { posts },
    };
}

// Specify dynamic routes to pre-render pages based on data.
// The HTML is generated at build time and will be reused on each request.
export async function getStaticPaths() {
    const categories = await getCategories();
    return {
        paths: categories.map(({ slug }) => ({ params: { slug } })),
        fallback: true,
    };
}
```

### pages\index.js
```
import Landing from "../sections/Landing"
import Categories from "../components/Categories"
import ChosenBlog from "../sections/ChosenBlog"
import SubmitedBlog from "../sections/SubmitedBlog"
import Footer from "../components/Footer"


export default function Home() {
  return (
    <div >

      <Landing />
      <Categories />
      <ChosenBlog />
      <SubmitedBlog />
      <Footer />


    </div>
  )
}

```

### pages\post\[slug].js
```
import { useRouter } from 'next/router';
import Loader from '../../components/Loader';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
// import Comments from '../../components/Comments';
// import CommentsForm from '../../components/CommentsForm';

import { getPostDetails, getPosts } from '../../services';

import PostDetail from '../../components/PostDetail';




const PostDetails = ({ post }) => {
    const router = useRouter();

    if (router.isFallback) {
        return <Loader />;
    }

    console.log(post);



    return (
        <>
            <Navbar />
            <PostDetail post={post} />
            {/* <Comments /> */}
            {/* <CommentsForm /> */}
            <Footer />
        </>
    )




}

export default PostDetails





// Fetch data at build time
export async function getStaticProps({ params }) {
    const data = await getPostDetails(params.slug);
    return {
        props: {
            post: data,
        },
    };
}

// Specify dynamic routes to pre-render pages based on data.
// The HTML is generated at build time and will be reused on each request.
export async function getStaticPaths() {
    const posts = await getPosts();
    return {
        paths: posts.map(({ node: { slug } }) => ({ params: { slug } })),
        fallback: true,
    };
}
```

### pages\search\result.js
```
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import Categories from './../../components/Categories';


import { getPosts } from '../../services';

function result() {
    const [search, setsearch] = useState("")
    const [posts, setposts] = useState([])


    const handleSearch = async () => {
        try {
            console.log('Search:', search);

            const fetchedPosts = await getPosts(search);
            setposts(fetchedPosts)

            console.log('Fetched Posts:', posts);
        } catch (error) {
            console.log(error);
            setposts([]); // Clear the posts array
        }
    };


    return (
        <>
            <Navbar />
            <Categories />
            <div className='max-w-screen-xl  justify-between mx-auto min-h-screen p-5'>

                <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSearch()
                }}>
                    <label for="default-search" class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                    <div class="relative">
                        <input onChange={(e) => setsearch(e.target.value)} type="search" id="default-search" class="  block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-500 dark:focus:border-gray-500" placeholder="Search Mockups, Logos..." required />
                        <button type="submit" class="text-white absolute end-2.5 bottom-2.5 bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800">Search</button>
                    </div>
                </form>

                {/* post cart */}

                <div className='grid grid-cols-1  md:grid-cols-4 gap-6 mt-5 p-5'>

                    {
                        posts.filter((item) => search === "" || item.node.title.toLowerCase().includes(search.toLowerCase())).map((item) => (
                            <Link href={`/post/${item.node.slug}`} >
                                <div key={item.cursor} class="max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                                    <a href="#">
                                        <img class="rounded-t-lg w-full h-full  object-cover image-cover-post " src={item.node.featuredImgae.url} width={300} height={200} alt="image post" />
                                    </a>
                                    <div class="p-5">
                                        <a href="#">
                                            <h5 class="mb-2 title-post-sub">{item.node.title}</h5>
                                        </a>
                                        <p class="mb-3 paragraph-post-sub">{item.node.excerpt}</p>
                                        <a href="#" class="inline-flex items-center px-3 py-2 text-sm  text-center button-post-sub">
                                            Read more
                                            <svg class="w-3.5 h-3.5 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            </Link>
                        ))
                    }


                </div>
                {/* end psot cat  */}

            </div>

            <Footer />
        </>
    )
}

export default result
```

### pages\_app.js
```
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}

export default MyApp

```

### postcss.config.js
```
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

```

### README.md
```
<img src="https://github.com/Mehranlip/PersonalBlog-NextJs-GraphCms/assets/60979458/d420fea5-bf90-4e01-8517-8eeb33e6d4b6" />

# Getting Started
1-Go to https://hygraph.com and register <br/>
2-Go to https://app.hygraph.com/clone/acf04dd03aa54f20bc08dee86ba55094?name=Mehran_blog and clone the project<br/>
3-Go to the project settings and find and copy the API Content option in the API Access section <br/>
4-Now paste the API Content in the specified place in the env file <br/>
5-Run project <br/>
``` npm install ``` <br/>
``` npm run dev ```



```

### sections\ChosenBlog.js
```
"use client"
import { useState, useEffect } from 'react';
import moment from 'moment';
import Image from 'next/image'
import Link from 'next/link';



import CoverChosen from '../public/static-image/chosen-cover.png'
import account from "../public/icon/account.svg"
import comments from "../public/icon/comment.svg"
import date from "../public/icon/calendar.svg"

import account_dark from "../public/icon/dark-icon/account.svg"
import date_dark from "../public/icon/dark-icon/calendar.svg"

import { getPosts } from '../services'



function ChosenBlog() {


    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const postData = await getPosts();
                setPosts(postData);
            } catch (error) {
                console.error('Error fetching posts:', error);
            }
        };

        fetchPosts();
    }, []);





    return (
        <div class=" grid md:grid-cols-2 grid-cols-1 gap-4 justify-center items-center max-w-screen-xl  mx-auto p-4  ">
            <div class=" order-last md:order-first relative ">
                <div className='grid items-end cover-gradient p-5 '>
                    <div>
                        <div>
                            <h1 className='title-cover'>
                                For the Architecture & Interiors
                            </h1>
                            <p className='paragraph-cover mt-3'>
                                Los Angeles, United States <br />
                                Unknown device. And additional discription here.
                            </p>
                        </div>
                        <div className='mt-3 flex flex-row md:gap-10 gap-4'>
                            <div>
                                <Image src={account} width={20} height={20} className='inline ' />
                                <span className='name-account ml-2'>Mehran Asadi</span>
                            </div>
                            <div>
                                <Image src={comments} width={20} height={20} className='inline ' />
                                <span className='name-account ml-2'>9 Comments</span>
                            </div>
                            <div>
                                <Image src={date} width={20} height={20} className='inline ' />
                                <span className='name-account ml-2'>Apr 8, 2023</span>
                            </div>
                        </div>
                    </div>
                </div>
                <Image src={CoverChosen} className='cover-chosen' alt='cover' />
            </div>
            <div class="  p-2 order-first md:order-last ">
                {posts.slice(0, 3).map((item) => (
                    <div key={item.cursor} className='grid md:grid-cols-3 grid-cols-1 p-2 mt-3'>
                        <div className='col-span-1    '>
                            <Image src={item.node.featuredImgae.url} className='rounded-lg w-full h-full shadow-lg object-cover  ' width={300} height={280} alt='image-post' />
                        </div>
                        <div className=' col-span-2 p-3 col-start-1 '>
                            <Link href={`/post/${item.node.slug}`}>
                                <h1 className='title-chosen'>
                                    {item.node.title}
                                </h1>
                            </Link>
                            <p className='summary-shosen mt-3  '>
                                {item.node.excerpt}
                            </p>
                            <div className='mt-3 flex flex-row md:gap-10 gap-4'>
                                <div>
                                    <Image src={account_dark} width={20} height={20} className='inline ' alt="icon" />
                                    <span className=' name-account-chosen ml-2'>{item.node.author.name}</span>
                                </div>
                                <div>
                                    <Image src={date_dark} width={20} height={20} className='inline ' alt="icon" />
                                    <span className='name-account-chosen ml-2'>{moment(item.node.createdAt).format('MMM DD, YYYY')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}



export default ChosenBlog


```

### sections\Landing.js
```
import React from 'react'
import Navbar from '../components/Navbar'

function Landing() {
    return (
        <>
            <div className='Landing '>
                <Navbar />
                <div class=" grid md:grid-cols-2 grid-cols-1 gap-4 justify-center items-center max-w-screen-xl  mx-auto p-4  ">
                    <div class="p-2 order-last md:order-first">
                        <h1 className='title_landing'>
                            Submit your article
                            and join our network!
                        </h1>
                        <p className='paragraph_landing mt-5 md:mt-11'>
                            Don't waste time and join our community of authors! Share your knowledge
                            and experience with our readers and get the opportunity to become
                            a part of our professional and creative team!
                        </p>
                        <button className='button_landing px-5 py-2 mt-5 md:mt-11 '>
                            Submit Article
                        </button>
                    </div>
                    <div class=" landing_image p-2 order-first md:order-last ">

                    </div>
                </div>


            </div>

        </>
    )
}

export default Landing
```

### sections\SubmitedBlog.js
```
"use client"
import { useState, useEffect } from 'react';

import Image from 'next/image'

import { getPosts } from '../services'
import Link from 'next/link';



function SubmitedBlog() {
    const [posts, setPosts] = useState([]);
    const [displayCount, setDisplayCount] = useState(4);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const postData = await getPosts();
                setPosts(postData);
            } catch (error) {
                console.error('Error fetching posts:', error);
            }
        };

        fetchPosts();
    }, []);


    const handleShowMore = () => {
        setDisplayCount(displayCount + 4); // Increment the displayed post count by 4
    };



    return (
        <div className='max-w-screen-xl  mx-auto p-2'>
            <div className='flex flex-row justify-between p-3'>
                <span className='title-sub'>Submited Articles</span>
                <div className='text-right'>
                    <Image className='inline ' src="/icon/up-right-arrow 1.svg" width={50} height={50} />
                </div>
            </div>

            <div>

                <div className='grid grid-cols-1  md:grid-cols-4 gap-6 mt-5 p-5'>
                    {
                        posts.slice(0, displayCount).map((item) => (
                            <Link href={`/post/${item.node.slug}`} >
                                <div key={item.cursor} class="max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                                    <a href="#">
                                        <img class="rounded-t-lg w-full h-full  object-cover image-cover-post " src={item.node.featuredImgae.url} width={300} height={200} alt="image post" />
                                    </a>
                                    <div class="p-5">
                                        <a href="#">
                                            <h5 class="mb-2 title-post-sub">{item.node.title}</h5>
                                        </a>
                                        <p class="mb-3 paragraph-post-sub">{item.node.excerpt}</p>
                                        <a href="#" class="inline-flex items-center px-3 py-2 text-sm  text-center button-post-sub">
                                            Read more
                                            <svg class="w-3.5 h-3.5 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            </Link>
                        ))
                    }

                </div>
                <div className='grid grid-rows-3'>
                    <button onClick={handleShowMore}>
                        <a href="#" class="inline-flex items-center px-3 py-2 text-sm  text-center button-post-sub ">
                            Show More Post
                            <svg class="w-3.5 h-3.5 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                            </svg>
                        </a>
                    </button>
                </div>



            </div>
        </div >
    )
}

export default SubmitedBlog
```

### services\index.js
```
import { request, gql } from 'graphql-request';

const graphqlAPI = process.env.NEXT_PUBLIC_GRAPHCMS_ENDPOINT;

export const getPosts = async () => {
  const query = gql`
    query MyQuery {
      postsConnection {
        edges {
          cursor
          node {
            author {
              bio
              name
              id
              photo {
                url
              }
            }
            featuredImgae {
              url
            }
            createdAt
            slug
            title
            excerpt
            categories {
              name
              slug
            }
          }
        }
      }
    }
  `;

  const result = await request(graphqlAPI, query);

  return result.postsConnection.edges;
};

export const getCategories = async () => {
  const query = gql`
    query GetGategories {
        categories {
          name
          slug
        }
    }
  `;

  const result = await request(graphqlAPI, query);

  return result.categories;
};

export const getPostDetails = async (slug) => {
  const query = gql`
    query GetPostDetails($slug : String!) {
      post(where: {slug: $slug}) {
        title
        excerpt
        featuredImgae {
          url
        }
        author{
          name
          bio
          photo {
            url
          }
        }
        createdAt
        slug
        content {
          raw
        }
        categories {
          name
          slug
        }
      }
    }
  `;

  const result = await request(graphqlAPI, query, { slug });

  return result.post;
};

// export const getSimilarPosts = async (categories, slug) => {
//     const query = gql`
//     query GetPostDetails($slug: String!, $categories: [String!]) {
//       posts(
//         where: {slug_not: $slug, AND: {categories_some: {slug_in: $categories}}}
//         last: 3
//       ) {
//         title
//         featuredImage {
//           url
//         }
//         createdAt
//         slug
//       }
//     }
//   `;
//     const result = await request(graphqlAPI, query, { slug, categories });

//     return result.posts;
// };

// export const getAdjacentPosts = async (createdAt, slug) => {
//     const query = gql`
//     query GetAdjacentPosts($createdAt: DateTime!,$slug:String!) {
//       next:posts(
//         first: 1
//         orderBy: createdAt_ASC
//         where: {slug_not: $slug, AND: {createdAt_gte: $createdAt}}
//       ) {
//         title
//         featuredImage {
//           url
//         }
//         createdAt
//         slug
//       }
//       previous:posts(
//         first: 1
//         orderBy: createdAt_DESC
//         where: {slug_not: $slug, AND: {createdAt_lte: $createdAt}}
//       ) {
//         title
//         featuredImage {
//           url
//         }
//         createdAt
//         slug
//       }
//     }
//   `;

//     const result = await request(graphqlAPI, query, { slug, createdAt });

//     return { next: result.next[0], previous: result.previous[0] };
// };

export const getCategoryPost = async (slug) => {
  const query = gql`
    query GetCategoryPost($slug: String!) {
      postsConnection(where: {categories_some: {slug: $slug}}) {
        edges {
          cursor
          node {
            author {
              bio
              name
              id
              photo {
                url
              }
            }
            featuredImgae {
              url
            }
            createdAt
            slug
            title
            excerpt
            categories {
              name
              slug
            }
          }
        }
      }
    }
  `;

  const result = await request(graphqlAPI, query, { slug });

  return result.postsConnection.edges;
};

// export const getFeaturedPosts = async () => {
//     const query = gql`
//     query GetCategoryPost() {
//       posts(where: {featuredPost: true}) {
//         author {
//           name
//           photo {
//             url
//           }
//         }
//         featuredImage {
//           url
//         }
//         title
//         slug
//         createdAt
//       }
//     }
//   `;

//     const result = await request(graphqlAPI, query);

//     return result.posts;
// };

// export const submitComment = async (obj) => {
//   const result = await fetch('/api/comments', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(obj),
//   });

//   return result.json();
// };

// export const getComments = async (slug) => {
//   const query = gql`
//     query GetComments($slug:String!) {
//       comments(where: {post: {slug:$slug}}){
//         name
//         createdAt
//         comment
//       }
//     }
//   `;

//   const result = await request(graphqlAPI, query, { slug });

//   return result.comments;
// };

// export const getRecentPosts = async () => {
//     const query = gql`
//     query GetPostDetails() {
//       posts(
//         orderBy: createdAt_ASC
//         last: 3
//       ) {
//         title
//         featuredImage {
//           url
//         }
//         createdAt
//         slug
//       }
//     }
//   `;
//     const result = await request(graphqlAPI, query);

//     return result.posts;
// };
```

### styles\globals.css
```
@tailwind base;
@tailwind components;
@tailwind utilities;

/* tailwind css  */

/* font face */

@font-face {
  font-family: "Kaisei Decol Bold";
  src: url("../public/font/KaiseiDecol-Bold.woff");
}

@font-face {
  font-family: "Kaisei Decol";
  src: url("../public/font/KaiseiDecol-Medium.woff");
}

@font-face {
  font-family: "Kaisei Decol Regular";
  src: url("../public/font/KaiseiDecol-Regular.woff");
}

@font-face {
  font-family: "Lato";
  src: url("../public/font/Lato-Regular.woff");
}

/* end font face */

/* Navbar */
.Main_logo {
  color: var(--general-body-text, #333);
  font-family: Kaisei Decol;
  font-size: 25px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}

.Navbar_link {
  color: var(--general-body-text, #333);
  text-align: center;
  font-family: Lato;
  font-size: 16px;
  font-style: normal;
  font-weight: 300;
  line-height: normal;
}

.button_navbar {
  color: var(--general-body-text, #333);
  text-align: center;
  font-family: Lato;
  font-size: 16px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  letter-spacing: 0.8px;
  background-color: white !important;
}

/* end Navbar  */

/* Landing  */
.Landing {
  background: var(--main-primary-one, #edecff);
  height: fit-content;
}

.title_landing {
  color: var(--general-body-text, #333);
  font-family: Kaisei Decol;
  font-size: 56px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}

.paragraph_landing {
  color: var(--general-body-text, #333);
  font-family: Lato;
  font-size: 16px;
  font-style: normal;
  font-weight: 300;
  line-height: 24px;
  /* 150% */
}

.button_landing {
  color: var(--general-body-text, #333);
  text-align: center;
  font-family: Lato;
  font-size: 16px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  letter-spacing: 0.8px;
  border-left: 4px solid var(--general-body-text, #333);
  background: var(--main-primary-three, #fdd9d3);
}

@media only screen and (max-width: 600px) {
  .landing_image {
    height: 50dvh !important;
  }

  .title_landing {
    font-size: 35px;
  }

  .cat_main {
    display: none;
  }

  .name-account {
    font-size: 10px !important;
  }

  .title-sub {
    font-size: 30px !important;
  }
}

.landing_image {
  background-image: url("../public/static-image/landing_image.svg");
  background-repeat: no-repeat;
  background-size: contain;
  height: 90dvh;
  width: 100%;
  background-position: center;
}

/* end Landing */

/* Categories */

.cat_main {
  color: var(--general-body-text, #333);
  font-family: Kaisei Decol;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 24px;
  /* 150% */
}

.cat_title {
  color: var(--general-body-text, #333);
  font-family: Kaisei Decol;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 24px;
  /* 150% */
  /* text-decoration-line: overline; */
  border-bottom: solid 1.5px #000000;
  padding-bottom: 3px;
}

/* end Categories */

/* chosen Blog */
.cover-gradient {
  border-radius: 32px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.00) 16.25%, rgba(0, 0, 0, 0.21) 50.62%, rgba(0, 0, 0, 0.72) 100%);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.cover-chosen {
  width: 100%;
  height: 100%;
}

.title-cover {
  color: #FFF;
  font-family: Kaisei Decol;
  font-size: 24px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}

.paragraph-cover {
  color: #FFF;
  font-family: Lato;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 24px;
  /* 150% */
}

.name-account {
  color: #FFF;
  font-family: Lato;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 18px;
  /* 150% */
}

.name-account-chosen {
  color: #000000;
  font-family: Lato;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 18px;
  /* 150% */
}

.title-chosen {
  color: var(--general-body-text, #333);
  font-family: Kaisei Decol;
  font-size: 20px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}

.summary-shosen {
  color: var(--general-body-text, #333);
  font-family: Lato;
  font-size: 14px;
  font-style: normal;
  font-weight: 300;
  line-height: 24px;
  text-align: justify;
  /* 150% */
}



/* end chosen Blog */

/* submited blog */
.title-sub {
  color: var(--general-body-text, #333);
  font-family: Kaisei Decol;
  font-size: 35px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}


.title-post-sub {
  color: var(--general-body-text, #333);
  font-family: Kaisei Decol;
  font-size: 25px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}

.paragraph-post-sub {
  color: var(--general-body-text, #333);
  font-family: Lato;
  font-size: 16px;
  font-style: normal;
  font-weight: 300;
  line-height: 24px;
  text-align: justify;
}

.button-post-sub {
  color: var(--general-body-text, #333);
  font-family: Kaisei Decol;
  font-size: 10px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}

/* end submited blog */

/* Footer */

.footer-link {
  color: var(--general-body-text, #333);
  text-align: center;
  font-family: Lato;
  font-size: 16px;
  font-style: normal;
  font-weight: 300;
  line-height: normal;
}

.copyright {
  color: var(--general-body-text, #333);
  font-family: Kaisei Decol;
  font-size: 15px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}

.image-cover-post {
  height: 200px !important;
}

/* end Footer */

/* // post Detailes */
.title-post-detail {
  color: var(--general-body-text, #ffffff);
  font-family: Kaisei Decol;
  font-size: 35px !important;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}

.name-account-post-detail {
  color: #ffffff;
  font-family: Lato;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 18px;
}

.cover-post-details {
  border-radius: 32px;
  height: 80dvh;
}

.paragraph-post-details {
  color: var(--general-body-text, #333);
  font-family: Lato;
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: 24px;
  text-align: justify;
  /* 150% */
}


@media only screen and (max-width: 600px) {
  .title-post-detail {
    font-size: 25px !important;
  }

  .cover-post-details {
    height: 50dvh;
  }

  .name-account-post-detail {
    font-size: 15px !important;
  }
}


/* // end post Detailes */
```

### tailwind.config.js
```
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("flowbite/plugin")
  ],
}
```

