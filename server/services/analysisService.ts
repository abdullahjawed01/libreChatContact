import Contact from '../models/Contact.js';

const TOP_N = 20;

/**
 * Runs all campaign insight aggregation pipelines concurrently.
 * Never loads full documents into memory.
 */
export const getCampaignInsights = async () => {
    const [topCompanies, roles, industries, locations, interests, datasetHealth] = await Promise.all([
        getTopCompanies(),
        getRoleDistribution(),
        getIndustrySegmentation(),
        getLocationClustering(),
        getInterestSegmentation(),
        getDatasetHealth(),
    ]);

    return { topCompanies, roles, industries, locations, interests, datasetHealth };
};

/** Dataset health & completeness snapshot */
export const getDatasetHealth = async () => {
    const [summary] = (await Contact.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                withCompany: { $sum: { $cond: [{ $and: [{ $ifNull: ['$company', false] }, { $ne: ['$company', ''] }] }, 1, 0] } },
                withRole: { $sum: { $cond: [{ $and: [{ $ifNull: ['$role', false] }, { $ne: ['$role', ''] }] }, 1, 0] } },
                withEmail: { $sum: { $cond: [{ $and: [{ $ifNull: ['$email', false] }, { $ne: ['$email', ''] }] }, 1, 0] } },
                withNotes: { $sum: { $cond: [{ $and: [{ $ifNull: ['$notes', false] }, { $ne: ['$notes', ''] }] }, 1, 0] } },
                attributeSizeSum: { $sum: { $size: { $ifNull: [{ $objectToArray: { $ifNull: ['$attributes', {}] } }, []] } } },
            }
        },
        {
            $project: {
                _id: 0,
                total: 1,
                withCompany: 1,
                withRole: 1,
                withEmail: 1,
                withNotes: 1,
                companyPct: { $round: [{ $multiply: [{ $divide: ['$withCompany', { $max: ['$total', 1] }] }, 100] }, 1] },
                rolePct: { $round: [{ $multiply: [{ $divide: ['$withRole', { $max: ['$total', 1] }] }, 100] }, 1] },
                emailPct: { $round: [{ $multiply: [{ $divide: ['$withEmail', { $max: ['$total', 1] }] }, 100] }, 1] },
                notesPct: { $round: [{ $multiply: [{ $divide: ['$withNotes', { $max: ['$total', 1] }] }, 100] }, 1] },
                avgAttributesPerContact: { $round: [{ $divide: ['$attributeSizeSum', { $max: ['$total', 1] }] }, 1] },
            }
        }
    ])) || [];

    // Estimate unique companies & roles in parallel for richness stats
    const [uniqueCompanies, uniqueRoles] = await Promise.all([
        Contact.distinct('company').then(arr => arr.filter(Boolean).length),
        Contact.distinct('role').then(arr => arr.filter(Boolean).length),
    ]);

    return summary
        ? { ...summary, uniqueCompanies, uniqueRoles }
        : {
            total: 0, withCompany: 0, withRole: 0, withEmail: 0, withNotes: 0,
            companyPct: 0, rolePct: 0, emailPct: 0, notesPct: 0,
            avgAttributesPerContact: 0, uniqueCompanies: 0, uniqueRoles: 0
        };
};

/** Top companies by contact count. */
const getTopCompanies = async () =>
    Contact.aggregate([
        { $match: { company: { $exists: true, $ne: '' } } },
        { $group: { _id: '$company', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: TOP_N },
        { $project: { _id: 0, name: '$_id', count: 1 } },
    ]);

/** Role distribution — highlights decision-makers. */
const getRoleDistribution = async () => {
    const DECISION_MAKER_ROLES = [
        'CTO', 'CEO', 'Founder', 'VP Engineering', 'Director of Engineering',
        'Product Manager', 'Head of Product', 'Managing Director'
    ];

    return Contact.aggregate([
        { $match: { role: { $exists: true, $ne: '' } } },
        { $project: { role: 1, roleNormalized: { $toUpper: { $trim: { input: '$role' } } } } },
        {
            $facet: {
                decisionMakers: [
                    { $match: { $or: DECISION_MAKER_ROLES.map(r => ({ roleNormalized: new RegExp(r.replace(' ', '\\s'), 'i') })) } },
                    { $group: { _id: '$role', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ],
                otherRoles: [
                    { $group: { _id: '$role', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: TOP_N }
                ]
            }
        },
        { $project: { combined: { $concatArrays: ['$decisionMakers', '$otherRoles'] } } },
        { $unwind: '$combined' },
        { $group: { _id: '$combined._id', count: { $first: '$combined.count' } } },
        { $sort: { count: -1 } },
        { $limit: TOP_N },
        { $project: { _id: 0, name: '$_id', count: 1 } }
    ]);
};

/** Industry segmentation via arbitrary "Industry" attribute. */
const getIndustrySegmentation = async () =>
    Contact.aggregate([
        {
            $project: {
                industryRaw: {
                    $ifNull: [
                        { $getField: { field: 'Industry', input: '$attributes' } },
                        { $getField: { field: 'industry', input: '$attributes' } },
                    ]
                }
            }
        },
        { $match: { industryRaw: { $exists: true, $nin: [null, ''] } } },
        { $group: { _id: '$industryRaw', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: TOP_N },
        { $project: { _id: 0, name: '$_id', count: 1 } },
    ]);

/** Location clustering via City / Location attributes. */
const getLocationClustering = async () =>
    Contact.aggregate([
        {
            $project: {
                locationRaw: {
                    $ifNull: [
                        { $getField: { field: 'City', input: '$attributes' } },
                        {
                            $ifNull: [
                                { $getField: { field: 'city', input: '$attributes' } },
                                {
                                    $ifNull: [
                                        { $getField: { field: 'Location', input: '$attributes' } },
                                        { $getField: { field: 'location', input: '$attributes' } }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }
        },
        { $match: { locationRaw: { $exists: true, $nin: [null, ''] } } },
        { $group: { _id: '$locationRaw', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: TOP_N },
        { $project: { _id: 0, name: '$_id', count: 1 } },
    ]);

/** Interest-based segmentation from Interests / Tags, split by comma. */
const getInterestSegmentation = async () =>
    Contact.aggregate([
        {
            $project: {
                interestRaw: {
                    $ifNull: [
                        { $getField: { field: 'Interests', input: '$attributes' } },
                        {
                            $ifNull: [
                                { $getField: { field: 'interests', input: '$attributes' } },
                                {
                                    $ifNull: [
                                        { $getField: { field: 'Tags', input: '$attributes' } },
                                        { $getField: { field: 'tags', input: '$attributes' } }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }
        },
        { $match: { interestRaw: { $exists: true, $nin: [null, ''] } } },
        { $project: { tags: { $split: ['$interestRaw', ','] } } },
        { $unwind: '$tags' },
        { $project: { tag: { $trim: { input: '$tags' } } } },
        { $match: { tag: { $ne: '' } } },
        { $group: { _id: '$tag', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: TOP_N },
        { $project: { _id: 0, name: '$_id', count: 1 } },
    ]);
